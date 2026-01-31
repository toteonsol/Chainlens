// Known contract addresses and their labels
// This helps identify what contracts users interact with

export interface KnownContract {
  name: string;
  type: 'dex' | 'lending' | 'bridge' | 'nft' | 'staking' | 'token' | 'other';
  description?: string;
}

// Common contracts across chains (addresses in lowercase)
export const KNOWN_CONTRACTS: Record<string, Record<string, KnownContract>> = {
  ethereum: {
    '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': { name: 'Uniswap V2 Router', type: 'dex' },
    '0xe592427a0aece92de3edee1f18e0157c05861564': { name: 'Uniswap V3 Router', type: 'dex' },
    '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45': { name: 'Uniswap Universal Router', type: 'dex' },
    '0xdef1c0ded9bec7f1a1670819833240f027b25eff': { name: '0x Exchange Proxy', type: 'dex' },
    '0x1111111254eeb25477b68fb85ed929f73a960582': { name: '1inch Router V5', type: 'dex' },
    '0x881d40237659c251811cec9c364ef91dc08d300c': { name: 'Metamask Swap Router', type: 'dex' },
    '0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9': { name: 'Aave V2 Pool', type: 'lending' },
    '0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2': { name: 'Aave V3 Pool', type: 'lending' },
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': { name: 'WETH', type: 'token' },
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { name: 'USDC', type: 'token' },
    '0xdac17f958d2ee523a2206206994597c13d831ec7': { name: 'USDT', type: 'token' },
    '0x6b175474e89094c44da98b954eedeac495271d0f': { name: 'DAI', type: 'token' },
    '0x00000000006c3852cbef3e08e8df289169ede581': { name: 'OpenSea Seaport', type: 'nft' },
    '0x7be8076f4ea4a4ad08075c2508e481d6c946d12b': { name: 'OpenSea (Legacy)', type: 'nft' },
    '0x99c9fc46f92e8a1c0dec1b1747d010903e884be1': { name: 'Optimism Bridge', type: 'bridge' },
    '0x8315177ab297ba92a06054ce80a67ed4dbd7ed3a': { name: 'Arbitrum Bridge', type: 'bridge' },
    '0x32400084c286cf3e17e7b677ea9583e60a000324': { name: 'zkSync Bridge', type: 'bridge' },
    '0xae7ab96520de3a18e5e111b5eaab095312d7fe84': { name: 'Lido stETH', type: 'staking' },
    '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8': { name: 'Binance Hot Wallet', type: 'other' },
  },
  polygon: {
    '0xa5e0829caced8ffdd4de3c43696c57f7d7a678ff': { name: 'QuickSwap Router', type: 'dex' },
    '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506': { name: 'SushiSwap Router', type: 'dex' },
    '0xe592427a0aece92de3edee1f18e0157c05861564': { name: 'Uniswap V3 Router', type: 'dex' },
    '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45': { name: 'Uniswap Universal Router', type: 'dex' },
    '0x1111111254eeb25477b68fb85ed929f73a960582': { name: '1inch Router V5', type: 'dex' },
    '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270': { name: 'WMATIC', type: 'token' },
    '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': { name: 'USDC.e', type: 'token' },
    '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359': { name: 'USDC', type: 'token' },
    '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': { name: 'USDT', type: 'token' },
    '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063': { name: 'DAI', type: 'token' },
    '0x794a61358d6845594f94dc1db02a252b5b4814ad': { name: 'Aave V3 Pool', type: 'lending' },
  },
  arbitrum: {
    '0xe592427a0aece92de3edee1f18e0157c05861564': { name: 'Uniswap V3 Router', type: 'dex' },
    '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45': { name: 'Uniswap Universal Router', type: 'dex' },
    '0x1111111254eeb25477b68fb85ed929f73a960582': { name: '1inch Router V5', type: 'dex' },
    '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506': { name: 'SushiSwap Router', type: 'dex' },
    '0xc873fecbd354f5a56e00e710b90ef4201db2448d': { name: 'Camelot Router', type: 'dex' },
    '0x82af49447d8a07e3bd95bd0d56f35241523fbab1': { name: 'WETH', type: 'token' },
    '0xaf88d065e77c8cc2239327c5edb3a432268e5831': { name: 'USDC', type: 'token' },
    '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8': { name: 'USDC.e', type: 'token' },
    '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9': { name: 'USDT', type: 'token' },
    '0x794a61358d6845594f94dc1db02a252b5b4814ad': { name: 'Aave V3 Pool', type: 'lending' },
    '0xc36442b4a4522e871399cd717abdd847ab11fe88': { name: 'Uniswap V3 Positions NFT', type: 'nft' },
    '0x912ce59144191c1204e64559fe8253a0e49e6548': { name: 'ARB Token', type: 'token' },
  },
  optimism: {
    '0xe592427a0aece92de3edee1f18e0157c05861564': { name: 'Uniswap V3 Router', type: 'dex' },
    '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45': { name: 'Uniswap Universal Router', type: 'dex' },
    '0x1111111254eeb25477b68fb85ed929f73a960582': { name: '1inch Router V5', type: 'dex' },
    '0x4200000000000000000000000000000000000042': { name: 'OP Token', type: 'token' },
    '0x4200000000000000000000000000000000000006': { name: 'WETH', type: 'token' },
    '0x0b2c639c533813f4aa9d7837caf62653d097ff85': { name: 'USDC', type: 'token' },
    '0x7f5c764cbc14f9669b88837ca1490cca17c31607': { name: 'USDC.e', type: 'token' },
    '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58': { name: 'USDT', type: 'token' },
    '0x794a61358d6845594f94dc1db02a252b5b4814ad': { name: 'Aave V3 Pool', type: 'lending' },
    '0x9c4ec768c28520b50860ea7a15bd7213a9ff58bf': { name: 'Velodrome Router', type: 'dex' },
  },
  base: {
    '0x2626664c2603336e57b271c5c0b26f421741e481': { name: 'Uniswap Universal Router', type: 'dex' },
    '0x1111111254eeb25477b68fb85ed929f73a960582': { name: '1inch Router V5', type: 'dex' },
    '0x4200000000000000000000000000000000000006': { name: 'WETH', type: 'token' },
    '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': { name: 'USDC', type: 'token' },
    '0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca': { name: 'USDbC', type: 'token' },
    '0xcf205808ed36593aa40a44f10c7f7c2f67d4a4d4': { name: 'Aerodrome Router', type: 'dex' },
  },
  bsc: {
    '0x10ed43c718714eb63d5aa57b78b54704e256024e': { name: 'PancakeSwap V2 Router', type: 'dex' },
    '0x13f4ea83d0bd40e75c8222255bc855a974568dd4': { name: 'PancakeSwap V3 Router', type: 'dex' },
    '0x1111111254eeb25477b68fb85ed929f73a960582': { name: '1inch Router V5', type: 'dex' },
    '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c': { name: 'WBNB', type: 'token' },
    '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d': { name: 'USDC', type: 'token' },
    '0x55d398326f99059ff775485246999027b3197955': { name: 'USDT', type: 'token' },
    '0xe9e7cea3dedca5984780bafc599bd69add087d56': { name: 'BUSD', type: 'token' },
    '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82': { name: 'CAKE Token', type: 'token' },
  },
  avalanche: {
    '0x60ae616a2155ee3d9a68541ba4544862310933d4': { name: 'TraderJoe Router', type: 'dex' },
    '0xe54ca86531e17ef3616d22ca28b0d458b6c89106': { name: 'Pangolin Router', type: 'dex' },
    '0x1111111254eeb25477b68fb85ed929f73a960582': { name: '1inch Router V5', type: 'dex' },
    '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7': { name: 'WAVAX', type: 'token' },
    '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e': { name: 'USDC', type: 'token' },
    '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664': { name: 'USDC.e', type: 'token' },
    '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7': { name: 'USDT', type: 'token' },
    '0x794a61358d6845594f94dc1db02a252b5b4814ad': { name: 'Aave V3 Pool', type: 'lending' },
  },
  solana: {
    'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4': { name: 'Jupiter Aggregator', type: 'dex' },
    '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8': { name: 'Raydium AMM', type: 'dex' },
    'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc': { name: 'Orca Whirlpool', type: 'dex' },
    'MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD': { name: 'Marinade Finance', type: 'staking' },
    'So11111111111111111111111111111111111111112': { name: 'Wrapped SOL', type: 'token' },
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { name: 'USDC', type: 'token' },
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { name: 'USDT', type: 'token' },
  },
};

// Known method signatures and their human-readable names
export const KNOWN_METHODS: Record<string, { name: string; action: string }> = {
  '0xa9059cbb': { name: 'transfer', action: 'Token Transfer' },
  '0x23b872dd': { name: 'transferFrom', action: 'Token Transfer' },
  '0x095ea7b3': { name: 'approve', action: 'Token Approval' },
  '0x3593564c': { name: 'execute', action: 'Swap' },
  '0x5ae401dc': { name: 'multicall', action: 'Multi-call' },
  '0x38ed1739': { name: 'swapExactTokensForTokens', action: 'Swap' },
  '0x8803dbee': { name: 'swapTokensForExactTokens', action: 'Swap' },
  '0x7ff36ab5': { name: 'swapExactETHForTokens', action: 'Swap' },
  '0x18cbafe5': { name: 'swapExactTokensForETH', action: 'Swap' },
  '0xfb3bdb41': { name: 'swapETHForExactTokens', action: 'Swap' },
  '0x4a25d94a': { name: 'swapTokensForExactETH', action: 'Swap' },
  '0xe8e33700': { name: 'addLiquidity', action: 'Add Liquidity' },
  '0xf305d719': { name: 'addLiquidityETH', action: 'Add Liquidity' },
  '0xbaa2abde': { name: 'removeLiquidity', action: 'Remove Liquidity' },
  '0x02751cec': { name: 'removeLiquidityETH', action: 'Remove Liquidity' },
  '0x2e1a7d4d': { name: 'withdraw', action: 'Withdraw' },
  '0xd0e30db0': { name: 'deposit', action: 'Deposit' },
  '0xa694fc3a': { name: 'stake', action: 'Stake' },
  '0x2e17de78': { name: 'unstake', action: 'Unstake' },
  '0x4e71d92d': { name: 'claim', action: 'Claim Rewards' },
  '0x3d18b912': { name: 'getReward', action: 'Claim Rewards' },
  '0xe449022e': { name: 'uniswapV3Swap', action: 'Swap' },
  '0x0502b1c5': { name: 'unoswap', action: 'Swap' },
  '0x12aa3caf': { name: 'swap', action: 'Swap' },
  '0x42842e0e': { name: 'safeTransferFrom', action: 'NFT Transfer' },
  '0xb88d4fde': { name: 'safeTransferFrom', action: 'NFT Transfer' },
  '0xfb0f3ee1': { name: 'fulfillBasicOrder', action: 'NFT Purchase' },
  '0x00000000': { name: 'Contract Creation', action: 'Deploy Contract' },
};

// Get contract info by address and chain
export function getKnownContract(chainId: string, address: string): KnownContract | null {
  const chainContracts = KNOWN_CONTRACTS[chainId];
  if (!chainContracts) return null;
  return chainContracts[address.toLowerCase()] || null;
}

// Get method info by method ID
export function getMethodInfo(methodId: string): { name: string; action: string } | null {
  if (!methodId || methodId.length < 10) return null;
  const id = methodId.slice(0, 10).toLowerCase();
  return KNOWN_METHODS[id] || null;
}

// Contract type colors and icons
export const CONTRACT_TYPE_CONFIG: Record<string, { color: string; label: string }> = {
  dex: { color: 'text-purple-400', label: 'DEX' },
  lending: { color: 'text-cyan-400', label: 'Lending' },
  bridge: { color: 'text-blue-400', label: 'Bridge' },
  nft: { color: 'text-pink-400', label: 'NFT' },
  staking: { color: 'text-emerald-400', label: 'Staking' },
  token: { color: 'text-amber-400', label: 'Token' },
  other: { color: 'text-muted-foreground', label: 'Other' },
};
