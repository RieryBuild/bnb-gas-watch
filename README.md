# ⛽ bnb-gas-watch

![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![Dependencies](https://img.shields.io/badge/dependencies-0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

Cek harga gas **BSC (BNB Smart Chain)** saat ini juga, plus estimasi biaya
transaksi dalam BNB — dan rupiah kalau kamu kasih rate-nya.

Buat yang sering mint/claim: sebelum gas, cek dulu fee-nya lagi mahal atau murah.

## Pakai

```bash
node gas.cjs
# ⛽ BSC Gas Watch
# Block   : 71.234.567
# Gas     : 0.100 Gwei
#
# Estimasi biaya per transaksi:
#   gas 100000  ->  0.00001 BNB
#   gas 150000  ->  0.000015 BNB
#   gas 250000  ->  0.000025 BNB
#   gas 500000  ->  0.00005 BNB
```

```bash
# Dengan nilai rupiah (rate manual per 1 BNB)
node gas.cjs --idr 12500000

# Output JSON buat di-pipe ke tool lain
node gas.cjs --json
```

## Cara kerja

- Query `eth_gasPrice` + `eth_blockNumber` ke beberapa RPC publik BSC secara bergantian (fallback otomatis kalau satu RPC mati)
- Estimasi = gas price × gas limit, ditampilkan buat 4 ukuran transaksi umum (100k–500k gas)
- Tanpa library: cuma `fetch` bawaan Node 18+

## Lisensi

MIT
