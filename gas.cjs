#!/usr/bin/env node
/*
 * bnb-gas-watch — cek harga gas BSC + estimasi biaya transaksi dalam BNB.
 *
 *   node gas.cjs              -> harga gas sekarang + tabel estimasi
 *   node gas.cjs --json       -> output JSON (buat di-pipe ke tool lain)
 *   node gas.cjs --idr 12500000 -> sekalian tampilkan nilai rupiah (rate manual per 1 BNB)
 *
 * Tanpa library: cuma JSON-RPC publik BSC + fetch bawaan Node 18+.
 */
'use strict';

const RPCS = [
  'https://bsc-dataseed.binance.org',
  'https://bsc-dataseed1.defibit.io',
  'https://bsc.publicnode.com',
];
const GAS_LIMITS = [100000, 150000, 250000, 500000];

async function rpcCall(url, method, params) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'RPC error');
  return data.result;
}

async function getGasPrice() {
  let lastErr = null;
  for (const url of RPCS) {
    try {
      const [gasHex, blockHex] = await Promise.all([
        rpcCall(url, 'eth_gasPrice', []),
        rpcCall(url, 'eth_blockNumber', []),
      ]);
      return { rpc: url, gasWei: BigInt(gasHex), block: parseInt(blockHex, 16) };
    } catch (e) { lastErr = e; }
  }
  throw new Error('Semua RPC gagal dihubungi: ' + (lastErr ? lastErr.message : 'unknown'));
}

function fmtBnb(wei) {
  // tampilkan sampai 8 angka desimal, tanpa trailing zero berlebihan
  const s = (Number(wei) / 1e18).toFixed(8);
  return s.replace(/0+$/, '').replace(/\.$/, '.0');
}

async function main() {
  const args = process.argv.slice(2);
  const asJson = args.includes('--json');
  const idrIdx = args.indexOf('--idr');
  const idrRate = idrIdx >= 0 ? parseFloat(args[idrIdx + 1]) : null;

  const { rpc, gasWei, block } = await getGasPrice();
  const gwei = Number(gasWei) / 1e9;
  const estimates = GAS_LIMITS.map(limit => {
    const costWei = gasWei * BigInt(limit);
    const costBnb = Number(costWei) / 1e18;
    return {
      gasLimit: limit,
      costBnb,
      costIdr: idrRate ? Math.round(costBnb * idrRate) : null,
    };
  });

  if (asJson) {
    console.log(JSON.stringify({ chain: 'BSC', block, rpc, gasPriceGwei: gwei, estimates }, null, 2));
    return;
  }
  console.log('⛽ BSC Gas Watch');
  console.log('Block   :', block.toLocaleString('id-ID'));
  console.log('RPC     :', rpc);
  console.log('Gas     :', gwei.toFixed(3), 'Gwei');
  console.log('');
  console.log('Estimasi biaya per transaksi:');
  for (const e of estimates) {
    const idr = e.costIdr !== null ? '  (≈ Rp' + e.costIdr.toLocaleString('id-ID') + ')' : '';
    console.log('  gas ' + String(e.gasLimit).padStart(6) + '  ->  ' + fmtBnb(BigInt(Math.round(e.costBnb * 1e18))) + ' BNB' + idr);
  }
  if (!idrRate) console.log('\nTips: tambah --idr <rate per BNB> buat lihat nilai rupiahnya.');
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
