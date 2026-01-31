# ChainLens - Multi-Chain Transaction Explorer

A premium blockchain transaction explorer that supports 25+ networks with CSV export in Awakens format.

## Features

- **25+ Blockchain Networks**: Ethereum, Polygon, Arbitrum, Optimism, Base, Avalanche, BSC, Solana, Polkadot, Bittensor, Cosmos, Osmosis, and more
- **Real Blockchain Data**: Fetches live transaction data from actual blockchain APIs
- **Beautiful UI/UX**: Premium dark theme with glass morphism effects and smooth animations
- **Transaction Table**: Sortable columns, filtering by type/status, search functionality
- **Known Contract Labels**: Identifies popular DEXes, lending protocols, bridges, and tokens
- **CSV Export**: Export transactions in Awakens format for tax reporting
- **Address Validation**: Automatic format validation per chain with helpful hints
- **Privacy First**: No data stored on servers
- **Automatic Fallbacks**: If primary API fails, automatically tries backup endpoints
- **Detailed Error Messages**: Clear guidance when searches fail with actionable suggestions

## API Status & Rate Limits

### Free Public APIs (No Key Required)
These chains work immediately with generous limits:
- **Bitcoin** - Blockchain.info / Blockstream (fallback)
- **TRON** - TronScan public API
- **NEAR** - NearBlocks public API
- **Sui** - Public RPC endpoint
- **Aptos** - Public REST API
- **Avalanche** - Routescan free API
- **zkSync Era** - Public block explorer API
- **Cosmos Chains** (Osmosis, Cosmos Hub, Celestia, Injective) - Public LCD endpoints

### Rate Limited (Free Tier)
Work without keys but have strict rate limits (30 calls/min):
- **Polkadot, Kusama, Bittensor, Vara Network** - Subscan API
  - Get key at: https://pro.subscan.io/
  - Add as `VITE_SUBSCAN_API_KEY` for higher limits

### API Key Optional (Works Better With Key)
Work without keys at 5 calls/sec, better with free API key:
- **Ethereum** - `VITE_ETHERSCAN_API_KEY` (https://etherscan.io/apis)
- **Polygon** - `VITE_POLYGONSCAN_API_KEY` (https://polygonscan.com/apis)
- **Arbitrum** - `VITE_ARBISCAN_API_KEY` (https://arbiscan.io/apis)
- **Optimism** - `VITE_OPTIMISM_API_KEY`
- **Base** - `VITE_BASESCAN_API_KEY`
- **BNB Chain** - `VITE_BSCSCAN_API_KEY` (https://bscscan.com/apis)
- **Fantom** - `VITE_FTMSCAN_API_KEY`
- **Gnosis** - `VITE_GNOSISSCAN_API_KEY`
- **Linea** - `VITE_LINEASCAN_API_KEY`

### API Key Required
- **Solana** - Requires `VITE_HELIUS_API_KEY`
  - Get free key at: https://dev.helius.xyz/

## Wallet Address Formats

Each chain has a specific address format:
- **EVM Chains** (Ethereum, Polygon, etc.): `0x` + 40 hex characters
- **Polkadot/Kusama**: SS58 format (starts with 1)
- **Bittensor**: SS58 format (starts with 5)
- **Solana**: Base58 encoded (32-44 characters)
- **Cosmos Chains**: Bech32 format (e.g., `cosmos1...`, `osmo1...`)
- **Bitcoin**: Bech32 (`bc1...`) or Legacy (`1...` or `3...`)
- **TRON**: Starts with `T`, 34 characters
- **NEAR**: Account name (e.g., `alice.near`)
- **Sui/Aptos**: `0x` + 64 hex characters

## Fallback Endpoints

Many chains have automatic fallbacks if the primary API fails:
- EVM chains fallback to Blockscout
- Bitcoin fallbacks to Blockstream
- Cosmos chains fallback to alternative LCD endpoints

## Known Contracts

The app identifies popular protocols:
- **DEXes**: Uniswap, SushiSwap, PancakeSwap, Jupiter, etc.
- **Lending**: Aave V2/V3
- **Bridges**: Optimism Bridge, Arbitrum Bridge, zkSync Bridge
- **Tokens**: WETH, USDC, USDT, DAI, and more
- **NFT Marketplaces**: OpenSea Seaport
- **Staking**: Lido stETH, Marinade Finance

## Supported Chains

### EVM Chains
- Ethereum, Polygon, Arbitrum, Optimism, Base, Avalanche, BNB Chain, Fantom, Gnosis, Linea, zkSync Era

### Substrate/Polkadot
- Polkadot, Kusama, Bittensor, Vara Network

### Cosmos Ecosystem
- Cosmos Hub, Osmosis, Celestia, Injective

### Other Networks
- Solana, Sui, Aptos, NEAR, Bitcoin, Tron

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Icons**: Lucide React

## CSV Export Format (Awakens)

The exported CSV follows Awakens format with columns:
- Date, Type, Sent Currency, Sent Amount, Sent Cost Basis
- Received Currency, Received Amount, Received Cost Basis
- Fee Currency, Fee Amount, Description, TxHash, Blockchain, Wallet Address

## Getting Started

1. Select a blockchain from the dropdown
2. Enter a wallet address (format hint shown for each chain)
3. Click "Explore" to view transactions
4. Use filters to narrow down results
5. Click "Export CSV" to download in Awakens format

## Development

```bash
cd webapp
bun install
bun dev
```

## License

Open source - MIT License
