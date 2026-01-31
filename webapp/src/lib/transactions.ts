import type { Transaction, TransactionResponse } from './types';
import type { ChainConfig } from './chains';
import { getChainById } from './chains';

// Format value with proper decimals
function formatValue(value: string, decimals: number): string {
  if (!value || value === '0') return '0';
  const num = BigInt(value);
  const divisor = BigInt(10 ** decimals);
  const intPart = num / divisor;
  const fracPart = num % divisor;
  const fracStr = fracPart.toString().padStart(decimals, '0').slice(0, 6).replace(/0+$/, '');
  return fracStr ? `${intPart}.${fracStr}` : intPart.toString();
}

// Parse etherscan-style API response
function parseEtherscanTransaction(
  tx: Record<string, string>,
  chain: ChainConfig
): Transaction {
  const timestamp = tx.timeStamp || tx.timestamp || '0';
  const value = tx.value || '0';
  const gasUsed = tx.gasUsed || tx.gas || '0';
  const gasPrice = tx.gasPrice || '0';
  const fee = (BigInt(gasUsed) * BigInt(gasPrice)).toString();

  // Determine transaction type
  let type: Transaction['type'] = 'transfer';
  const input = tx.input || tx.data || '';

  if (tx.contractAddress || (input && input !== '0x' && input.length > 10)) {
    type = 'contract';
    // Check for common method signatures
    const methodId = input.slice(0, 10).toLowerCase();
    if (methodId === '0xa9059cbb' || methodId === '0x23b872dd') {
      type = 'token';
    } else if (methodId === '0x095ea7b3') {
      type = 'contract'; // approve
    }
  }

  // Parse status
  let status: Transaction['status'] = 'success';
  if (tx.isError === '1' || tx.txreceipt_status === '0') {
    status = 'failed';
  } else if (tx.confirmations === '0') {
    status = 'pending';
  }

  return {
    hash: tx.hash || tx.txhash || '',
    blockNumber: tx.blockNumber || tx.block || '',
    timestamp,
    from: tx.from || '',
    to: tx.to || tx.contractAddress || '',
    value,
    valueFormatted: formatValue(value, chain.decimals),
    fee,
    feeFormatted: formatValue(fee, chain.decimals),
    status,
    type,
    chainId: chain.id,
    chainName: chain.name,
    symbol: chain.symbol,
    method: tx.functionName?.split('(')[0] || undefined,
    gasUsed,
    gasPrice,
    nonce: tx.nonce,
    input,
    explorerUrl: `${chain.explorerUrl}/tx/${tx.hash || tx.txhash}`,
  };
}

// Parse Subscan API response (for Polkadot/Substrate chains)
function parseSubscanTransaction(
  tx: Record<string, unknown>,
  chain: ChainConfig
): Transaction {
  const timestamp = String(tx.block_timestamp || tx.timestamp || 0);
  const value = String(tx.amount || tx.value || 0);
  const fee = String(tx.fee || 0);

  let type: Transaction['type'] = 'transfer';
  const callModule = String(tx.call_module || tx.module || '').toLowerCase();
  const callFunction = String(tx.call_module_function || tx.call || '').toLowerCase();

  if (callModule === 'staking' || callFunction.includes('stake')) {
    type = 'stake';
  } else if (callFunction.includes('unstake') || callFunction.includes('unbond')) {
    type = 'unstake';
  } else if (callModule === 'balances') {
    type = 'transfer';
  }

  const status: Transaction['status'] = tx.success === false ? 'failed' : 'success';

  return {
    hash: String(tx.extrinsic_hash || tx.hash || ''),
    blockNumber: String(tx.block_num || tx.block || ''),
    timestamp,
    from: String(tx.account_id || tx.from || ''),
    to: String(tx.to || tx.destination || ''),
    value,
    valueFormatted: formatValue(value, chain.decimals),
    fee,
    feeFormatted: formatValue(fee, chain.decimals),
    status,
    type,
    chainId: chain.id,
    chainName: chain.name,
    symbol: chain.symbol,
    method: callFunction || undefined,
    explorerUrl: `${chain.explorerUrl}/extrinsic/${tx.extrinsic_hash || tx.hash}`,
  };
}

// Parse Solscan API response
function parseSolscanTransaction(
  tx: Record<string, unknown>,
  chain: ChainConfig
): Transaction {
  const timestamp = String(tx.blockTime || tx.timestamp || 0);
  const value = String(tx.lamport || tx.amount || 0);
  const fee = String(tx.fee || 0);

  let type: Transaction['type'] = 'transfer';
  if (tx.type === 'stake') type = 'stake';
  else if (tx.type === 'unstake') type = 'unstake';
  else if (tx.type === 'swap') type = 'swap';
  else if (tx.type === 'nft') type = 'nft';

  const status: Transaction['status'] = tx.status === 'fail' ? 'failed' : 'success';

  return {
    hash: String(tx.txHash || tx.signature || ''),
    blockNumber: String(tx.slot || tx.block || ''),
    timestamp,
    from: String(tx.signer || tx.from || ''),
    to: String(tx.to || tx.destination || ''),
    value,
    valueFormatted: formatValue(value, chain.decimals),
    fee,
    feeFormatted: formatValue(fee, chain.decimals),
    status,
    type,
    chainId: chain.id,
    chainName: chain.name,
    symbol: chain.symbol,
    explorerUrl: `${chain.explorerUrl}/tx/${tx.txHash || tx.signature}`,
  };
}

// Parse Cosmos/Mintscan style response
function parseCosmosTransaction(
  tx: Record<string, unknown>,
  chain: ChainConfig
): Transaction {
  const txData = (tx.tx as Record<string, unknown>) || tx;
  const body = (txData.body as Record<string, unknown>) || {};
  const messages = (body.messages as Array<Record<string, unknown>>) || [];
  const firstMsg = messages[0] || {};

  const timestamp = String(tx.timestamp || tx.time || 0);
  const value = String((firstMsg.amount as Array<{amount: string}>)?.[0]?.amount || 0);
  const fee = String(tx.fee || 0);

  let type: Transaction['type'] = 'transfer';
  const msgType = String(firstMsg['@type'] || '');
  if (msgType.includes('MsgDelegate')) type = 'stake';
  else if (msgType.includes('MsgUndelegate')) type = 'unstake';
  else if (msgType.includes('MsgSend')) type = 'transfer';

  const status: Transaction['status'] = tx.code === 0 || !tx.code ? 'success' : 'failed';

  return {
    hash: String(tx.txhash || tx.hash || ''),
    blockNumber: String(tx.height || tx.block || ''),
    timestamp,
    from: String(firstMsg.from_address || firstMsg.delegator_address || ''),
    to: String(firstMsg.to_address || firstMsg.validator_address || ''),
    value,
    valueFormatted: formatValue(value, chain.decimals),
    fee,
    feeFormatted: formatValue(fee, chain.decimals),
    status,
    type,
    chainId: chain.id,
    chainName: chain.name,
    symbol: chain.symbol,
    method: msgType.split('.').pop() || undefined,
    explorerUrl: `${chain.explorerUrl}/txs/${tx.txhash || tx.hash}`,
  };
}

// Fetch transactions for EVM chains (Etherscan-like APIs)
// Most Etherscan APIs have free tiers with rate limits (5 calls/sec without key)
async function fetchEVMTransactions(
  address: string,
  chain: ChainConfig,
  page = 1,
  limit = 50,
  endpointIndex = 0
): Promise<TransactionResponse> {
  // Build URL - API key is optional for most chains (lower rate limits without it)
  const apiKeyMap: Record<string, string | undefined> = {
    ethereum: import.meta.env.VITE_ETHERSCAN_API_KEY,
    polygon: import.meta.env.VITE_POLYGONSCAN_API_KEY,
    arbitrum: import.meta.env.VITE_ARBISCAN_API_KEY,
    optimism: import.meta.env.VITE_OPTIMISM_API_KEY,
    base: import.meta.env.VITE_BASESCAN_API_KEY,
    bsc: import.meta.env.VITE_BSCSCAN_API_KEY,
    avalanche: import.meta.env.VITE_SNOWTRACE_API_KEY,
    fantom: import.meta.env.VITE_FTMSCAN_API_KEY,
    gnosis: import.meta.env.VITE_GNOSISSCAN_API_KEY,
    linea: import.meta.env.VITE_LINEASCAN_API_KEY,
    zksync: import.meta.env.VITE_ZKSYNC_API_KEY,
  };

  // Get endpoint - primary or fallback
  const allEndpoints = [chain.apiEndpoint, ...(chain.fallbackEndpoints || [])];
  const currentEndpoint = allEndpoints[endpointIndex] || chain.apiEndpoint;
  const isBlockscout = currentEndpoint.includes('blockscout');

  const apiKey = apiKeyMap[chain.id];
  let url = `${currentEndpoint}?module=account&action=txlist&address=${address}&page=${page}&offset=${limit}&sort=desc`;
  if (apiKey && !isBlockscout) {
    url += `&apikey=${apiKey}`;
  }

  try {
    const response = await fetch(url);
    const data = await response.json() as { status: string; message: string; result: Array<Record<string, string>> | string };

    // Handle rate limit or error messages
    if (data.status !== '1' || !Array.isArray(data.result)) {
      const errorMsg = typeof data.result === 'string' ? data.result : data.message;
      console.warn(`${chain.name} API response from ${currentEndpoint}:`, errorMsg);

      // Try fallback endpoint if available
      if (endpointIndex < allEndpoints.length - 1) {
        console.log(`Trying fallback endpoint for ${chain.name}...`);
        return fetchEVMTransactions(address, chain, page, limit, endpointIndex + 1);
      }

      throw new Error(errorMsg || 'Failed to fetch transactions');
    }

    const transactions = data.result.map(tx => parseEtherscanTransaction(tx, chain));

    return {
      transactions,
      totalCount: transactions.length,
      page,
      limit,
      hasMore: transactions.length === limit,
    };
  } catch (error) {
    console.error(`Error fetching ${chain.name} transactions from ${currentEndpoint}:`, error);

    // Try fallback endpoint if available
    if (endpointIndex < allEndpoints.length - 1) {
      console.log(`Trying fallback endpoint for ${chain.name}...`);
      return fetchEVMTransactions(address, chain, page, limit, endpointIndex + 1);
    }

    throw error;
  }
}

// Fetch transactions for Substrate chains (Subscan API)
// Subscan has a free tier with rate limits
async function fetchSubstrateTransactions(
  address: string,
  chain: ChainConfig,
  page = 1,
  limit = 50
): Promise<TransactionResponse> {
  const url = `${chain.apiEndpoint}/api/v2/scan/extrinsics`;
  const apiKey = import.meta.env.VITE_SUBSCAN_API_KEY;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        address,
        page: page - 1,
        row: limit,
      }),
    });

    const data = await response.json() as {
      code: number;
      message: string;
      data: { extrinsics: Array<Record<string, unknown>>; count: number }
    };

    if (data.code !== 0 || !data.data?.extrinsics) {
      console.warn(`${chain.name} Subscan response:`, data.message);
      throw new Error(data.message || 'Failed to fetch transactions');
    }

    const transactions = data.data.extrinsics.map(tx => parseSubscanTransaction(tx, chain));

    return {
      transactions,
      totalCount: data.data.count || transactions.length,
      page,
      limit,
      hasMore: transactions.length === limit,
    };
  } catch (error) {
    console.error(`Error fetching ${chain.name} transactions:`, error);
    throw error;
  }
}

// Fetch transactions for Solana (using public Helius or Solscan API)
async function fetchSolanaTransactions(
  address: string,
  chain: ChainConfig,
  page = 1,
  limit = 50
): Promise<TransactionResponse> {
  // Solscan requires API key, but we can use Helius free tier or Solana RPC
  const heliusKey = import.meta.env.VITE_HELIUS_API_KEY;

  if (heliusKey) {
    // Use Helius API (has free tier)
    const url = `https://api.helius.xyz/v0/addresses/${address}/transactions?api-key=${heliusKey}&limit=${limit}`;
    try {
      const response = await fetch(url);
      const data = await response.json() as Array<Record<string, unknown>>;

      if (!Array.isArray(data)) {
        throw new Error('Invalid response from Helius');
      }

      const transactions = data.map(tx => ({
        hash: String(tx.signature || ''),
        blockNumber: String(tx.slot || ''),
        timestamp: String(tx.timestamp || 0),
        from: address,
        to: String((tx as Record<string, unknown>).destination || ''),
        value: '0',
        valueFormatted: '0',
        fee: String(tx.fee || 0),
        feeFormatted: formatValue(String(tx.fee || 0), chain.decimals),
        status: tx.transactionError ? 'failed' : 'success' as Transaction['status'],
        type: 'transfer' as Transaction['type'],
        chainId: chain.id,
        chainName: chain.name,
        symbol: chain.symbol,
        explorerUrl: `${chain.explorerUrl}/tx/${tx.signature}`,
      }));

      return {
        transactions,
        totalCount: transactions.length,
        page,
        limit,
        hasMore: transactions.length === limit,
      };
    } catch (error) {
      console.error('Helius API error:', error);
      throw error;
    }
  }

  // Fallback to Solscan public API (limited)
  const url = `${chain.apiEndpoint}/account/transactions?account=${address}&page=${page}&page_size=${limit}`;

  try {
    const response = await fetch(url);
    const data = await response.json() as { data: Array<Record<string, unknown>>; total: number };

    if (!Array.isArray(data.data)) {
      throw new Error('Solscan API requires authentication. Add VITE_HELIUS_API_KEY for Solana support.');
    }

    const transactions = data.data.map(tx => parseSolscanTransaction(tx, chain));

    return {
      transactions,
      totalCount: data.total || transactions.length,
      page,
      limit,
      hasMore: transactions.length === limit,
    };
  } catch (error) {
    console.error(`Error fetching ${chain.name} transactions:`, error);
    throw error;
  }
}

// Fetch transactions for Cosmos chains (public LCD endpoints)
async function fetchCosmosTransactions(
  address: string,
  chain: ChainConfig,
  page = 1,
  limit = 50,
  endpointIndex = 0
): Promise<TransactionResponse> {
  const offset = (page - 1) * limit;
  // Cosmos LCD endpoints are public and free
  const allEndpoints = [chain.apiEndpoint, ...(chain.fallbackEndpoints || [])];
  const currentEndpoint = allEndpoints[endpointIndex] || chain.apiEndpoint;
  const url = `${currentEndpoint}/cosmos/tx/v1beta1/txs?events=message.sender='${address}'&pagination.limit=${limit}&pagination.offset=${offset}&order_by=ORDER_BY_DESC`;

  try {
    const response = await fetch(url);
    const data = await response.json() as { txs: Array<Record<string, unknown>>; tx_responses: Array<Record<string, unknown>>; pagination: { total: string } };

    if (!Array.isArray(data.tx_responses)) {
      // Try fallback endpoint if available
      if (endpointIndex < allEndpoints.length - 1) {
        console.log(`Trying fallback endpoint for ${chain.name}...`);
        return fetchCosmosTransactions(address, chain, page, limit, endpointIndex + 1);
      }
      throw new Error('Failed to fetch Cosmos transactions');
    }

    const transactions = data.tx_responses.map(tx => parseCosmosTransaction(tx, chain));

    return {
      transactions,
      totalCount: parseInt(data.pagination?.total || '0'),
      page,
      limit,
      hasMore: transactions.length === limit,
    };
  } catch (error) {
    console.error(`Error fetching ${chain.name} transactions from ${currentEndpoint}:`, error);

    // Try fallback endpoint if available
    if (endpointIndex < allEndpoints.length - 1) {
      console.log(`Trying fallback endpoint for ${chain.name}...`);
      return fetchCosmosTransactions(address, chain, page, limit, endpointIndex + 1);
    }

    throw error;
  }
}

// Fetch transactions for Bitcoin (using public Blockchain.info or Blockstream API)
async function fetchBitcoinTransactions(
  address: string,
  chain: ChainConfig,
  page = 1,
  limit = 50,
  useFallback = false
): Promise<TransactionResponse> {
  const offset = (page - 1) * limit;

  // Primary: Blockchain.info, Fallback: Blockstream
  if (!useFallback) {
    const url = `https://blockchain.info/rawaddr/${address}?limit=${limit}&offset=${offset}`;

    try {
      const response = await fetch(url);
      const data = await response.json() as {
        txs: Array<{
          hash: string;
          block_height: number;
          time: number;
          inputs: Array<{ prev_out: { addr: string; value: number } }>;
          out: Array<{ addr: string; value: number }>;
          fee: number;
        }>;
        n_tx: number;
      };

      if (!Array.isArray(data.txs)) {
        throw new Error('Failed to fetch Bitcoin transactions');
      }

      const transactions: Transaction[] = data.txs.map(tx => {
        const value = tx.out.find(o => o.addr === address)?.value || 0;

        return {
          hash: tx.hash,
          blockNumber: String(tx.block_height || 'pending'),
          timestamp: String(tx.time),
          from: tx.inputs[0]?.prev_out?.addr || 'coinbase',
          to: tx.out[0]?.addr || '',
          value: String(value),
          valueFormatted: formatValue(String(value), chain.decimals),
          fee: String(tx.fee || 0),
          feeFormatted: formatValue(String(tx.fee || 0), chain.decimals),
          status: tx.block_height ? 'success' : 'pending',
          type: 'transfer',
          chainId: chain.id,
          chainName: chain.name,
          symbol: chain.symbol,
          explorerUrl: `https://blockchair.com/bitcoin/transaction/${tx.hash}`,
        };
      });

      return {
        transactions,
        totalCount: data.n_tx || transactions.length,
        page,
        limit,
        hasMore: transactions.length === limit,
      };
    } catch (error) {
      console.error(`Error fetching Bitcoin transactions from blockchain.info:`, error);
      console.log('Trying Blockstream fallback...');
      return fetchBitcoinTransactions(address, chain, page, limit, true);
    }
  }

  // Fallback: Blockstream API
  const url = `https://blockstream.info/api/address/${address}/txs`;

  try {
    const response = await fetch(url);
    const data = await response.json() as Array<{
      txid: string;
      status: { confirmed: boolean; block_height?: number; block_time?: number };
      fee: number;
      vin: Array<{ prevout: { scriptpubkey_address: string; value: number } }>;
      vout: Array<{ scriptpubkey_address: string; value: number }>;
    }>;

    if (!Array.isArray(data)) {
      throw new Error('Failed to fetch Bitcoin transactions');
    }

    const transactions: Transaction[] = data.slice(offset, offset + limit).map(tx => {
      const value = tx.vout.find(o => o.scriptpubkey_address === address)?.value || 0;

      return {
        hash: tx.txid,
        blockNumber: String(tx.status.block_height || 'pending'),
        timestamp: String(tx.status.block_time || Math.floor(Date.now() / 1000)),
        from: tx.vin[0]?.prevout?.scriptpubkey_address || 'coinbase',
        to: tx.vout[0]?.scriptpubkey_address || '',
        value: String(value),
        valueFormatted: formatValue(String(value), chain.decimals),
        fee: String(tx.fee || 0),
        feeFormatted: formatValue(String(tx.fee || 0), chain.decimals),
        status: tx.status.confirmed ? 'success' : 'pending',
        type: 'transfer',
        chainId: chain.id,
        chainName: chain.name,
        symbol: chain.symbol,
        explorerUrl: `https://blockstream.info/tx/${tx.txid}`,
      };
    });

    return {
      transactions,
      totalCount: transactions.length,
      page,
      limit,
      hasMore: transactions.length === limit,
    };
  } catch (error) {
    console.error(`Error fetching Bitcoin transactions:`, error);
    throw error;
  }
}

// Fetch transactions for TRON (TronScan public API)
async function fetchTronTransactions(
  address: string,
  chain: ChainConfig,
  page = 1,
  limit = 50
): Promise<TransactionResponse> {
  const start = (page - 1) * limit;
  // TronScan has a free public API
  const url = `https://apilist.tronscanapi.com/api/transaction?address=${address}&start=${start}&limit=${limit}&sort=-timestamp`;

  try {
    const response = await fetch(url);
    const data = await response.json() as {
      data: Array<{
        hash: string;
        block: number;
        timestamp: number;
        ownerAddress: string;
        toAddress: string;
        amount: number;
        cost: { fee: number };
        contractRet: string;
        contractType: number;
      }>;
      total: number;
    };

    if (!Array.isArray(data.data)) {
      throw new Error('Failed to fetch TRON transactions');
    }

    const transactions: Transaction[] = data.data.map(tx => ({
      hash: tx.hash,
      blockNumber: String(tx.block),
      timestamp: String(Math.floor(tx.timestamp / 1000)),
      from: tx.ownerAddress,
      to: tx.toAddress,
      value: String(tx.amount || 0),
      valueFormatted: formatValue(String(tx.amount || 0), chain.decimals),
      fee: String(tx.cost?.fee || 0),
      feeFormatted: formatValue(String(tx.cost?.fee || 0), chain.decimals),
      status: tx.contractRet === 'SUCCESS' ? 'success' : 'failed',
      type: tx.contractType === 1 ? 'transfer' : 'contract',
      chainId: chain.id,
      chainName: chain.name,
      symbol: chain.symbol,
      explorerUrl: `https://tronscan.org/#/transaction/${tx.hash}`,
    }));

    return {
      transactions,
      totalCount: data.total || transactions.length,
      page,
      limit,
      hasMore: transactions.length === limit,
    };
  } catch (error) {
    console.error(`Error fetching ${chain.name} transactions:`, error);
    throw error;
  }
}

// Fetch transactions for NEAR (NearBlocks public API)
async function fetchNearTransactions(
  address: string,
  chain: ChainConfig,
  page = 1,
  limit = 50
): Promise<TransactionResponse> {
  const offset = (page - 1) * limit;
  // NearBlocks has a free public API
  const url = `https://api.nearblocks.io/v1/account/${address}/txns?page=${page}&per_page=${limit}&order=desc`;

  try {
    const response = await fetch(url);
    const data = await response.json() as {
      txns: Array<{
        transaction_hash: string;
        included_in_block_hash: string;
        block_timestamp: string;
        signer_account_id: string;
        receiver_account_id: string;
        actions_agg: { deposit: number };
        outcomes_agg: { transaction_fee: number };
        outcomes: { status: boolean };
      }>;
      count: number;
    };

    if (!Array.isArray(data.txns)) {
      throw new Error('Failed to fetch NEAR transactions');
    }

    const transactions: Transaction[] = data.txns.map(tx => ({
      hash: tx.transaction_hash,
      blockNumber: tx.included_in_block_hash,
      timestamp: String(Math.floor(new Date(tx.block_timestamp).getTime() / 1000)),
      from: tx.signer_account_id,
      to: tx.receiver_account_id,
      value: String(tx.actions_agg?.deposit || 0),
      valueFormatted: formatValue(String(tx.actions_agg?.deposit || 0), chain.decimals),
      fee: String(tx.outcomes_agg?.transaction_fee || 0),
      feeFormatted: formatValue(String(tx.outcomes_agg?.transaction_fee || 0), chain.decimals),
      status: tx.outcomes?.status ? 'success' : 'failed',
      type: 'transfer',
      chainId: chain.id,
      chainName: chain.name,
      symbol: chain.symbol,
      explorerUrl: `https://nearblocks.io/txns/${tx.transaction_hash}`,
    }));

    return {
      transactions,
      totalCount: data.count || transactions.length,
      page,
      limit,
      hasMore: transactions.length === limit,
    };
  } catch (error) {
    console.error(`Error fetching ${chain.name} transactions:`, error);
    throw error;
  }
}

// Fetch transactions for Sui (public RPC)
async function fetchSuiTransactions(
  address: string,
  chain: ChainConfig,
  page = 1,
  limit = 50
): Promise<TransactionResponse> {
  const url = chain.apiEndpoint;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'suix_queryTransactionBlocks',
        params: [{
          filter: { FromAddress: address },
          options: { showInput: true, showEffects: true },
        }, null, limit, true],
      }),
    });

    const data = await response.json() as {
      result: {
        data: Array<{
          digest: string;
          checkpoint: string;
          timestampMs: string;
          transaction: { data: { sender: string } };
          effects: { status: { status: string }; gasUsed: { computationCost: string } };
        }>;
      };
    };

    if (!data.result?.data) {
      throw new Error('Failed to fetch Sui transactions');
    }

    const transactions: Transaction[] = data.result.data.map(tx => ({
      hash: tx.digest,
      blockNumber: tx.checkpoint || '',
      timestamp: String(Math.floor(Number(tx.timestampMs) / 1000)),
      from: tx.transaction?.data?.sender || address,
      to: '',
      value: '0',
      valueFormatted: '0',
      fee: tx.effects?.gasUsed?.computationCost || '0',
      feeFormatted: formatValue(tx.effects?.gasUsed?.computationCost || '0', chain.decimals),
      status: tx.effects?.status?.status === 'success' ? 'success' : 'failed',
      type: 'transfer',
      chainId: chain.id,
      chainName: chain.name,
      symbol: chain.symbol,
      explorerUrl: `https://suiscan.xyz/mainnet/tx/${tx.digest}`,
    }));

    return {
      transactions,
      totalCount: transactions.length,
      page,
      limit,
      hasMore: transactions.length === limit,
    };
  } catch (error) {
    console.error(`Error fetching ${chain.name} transactions:`, error);
    throw error;
  }
}

// Fetch transactions for Aptos (public REST API)
async function fetchAptosTransactions(
  address: string,
  chain: ChainConfig,
  page = 1,
  limit = 50
): Promise<TransactionResponse> {
  const offset = (page - 1) * limit;
  const url = `${chain.apiEndpoint}/accounts/${address}/transactions?limit=${limit}&start=${offset}`;

  try {
    const response = await fetch(url);
    const data = await response.json() as Array<{
      hash: string;
      version: string;
      timestamp: string;
      sender: string;
      success: boolean;
      gas_used: string;
      gas_unit_price: string;
    }>;

    if (!Array.isArray(data)) {
      throw new Error('Failed to fetch Aptos transactions');
    }

    const transactions: Transaction[] = data.map(tx => ({
      hash: tx.hash,
      blockNumber: tx.version,
      timestamp: String(Math.floor(Number(tx.timestamp) / 1000000)),
      from: tx.sender,
      to: '',
      value: '0',
      valueFormatted: '0',
      fee: String(BigInt(tx.gas_used) * BigInt(tx.gas_unit_price)),
      feeFormatted: formatValue(String(BigInt(tx.gas_used) * BigInt(tx.gas_unit_price)), chain.decimals),
      status: tx.success ? 'success' : 'failed',
      type: 'transfer',
      chainId: chain.id,
      chainName: chain.name,
      symbol: chain.symbol,
      explorerUrl: `https://explorer.aptoslabs.com/txn/${tx.hash}?network=mainnet`,
    }));

    return {
      transactions,
      totalCount: transactions.length,
      page,
      limit,
      hasMore: transactions.length === limit,
    };
  } catch (error) {
    console.error(`Error fetching ${chain.name} transactions:`, error);
    throw error;
  }
}

// Generate mock transactions for demo/testing when APIs are unavailable
function generateMockTransactions(
  address: string,
  chain: ChainConfig,
  count = 25
): Transaction[] {
  const types: Transaction['type'][] = ['transfer', 'contract', 'token', 'stake', 'swap'];
  const statuses: Transaction['status'][] = ['success', 'success', 'success', 'failed'];
  const now = Math.floor(Date.now() / 1000);

  return Array.from({ length: count }, (_, i) => {
    const isOutgoing = Math.random() > 0.5;
    const type = types[Math.floor(Math.random() * types.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const value = Math.floor(Math.random() * 10 ** (chain.decimals - 2)).toString();
    const fee = Math.floor(Math.random() * 10 ** (chain.decimals - 6)).toString();
    const timestamp = (now - i * 3600 - Math.floor(Math.random() * 3600)).toString();

    const hash = `0x${Array.from({ length: 64 }, () =>
      '0123456789abcdef'[Math.floor(Math.random() * 16)]
    ).join('')}`;

    const randomAddr = `0x${Array.from({ length: 40 }, () =>
      '0123456789abcdef'[Math.floor(Math.random() * 16)]
    ).join('')}`;

    return {
      hash,
      blockNumber: (20000000 - i * 100).toString(),
      timestamp,
      from: isOutgoing ? address : randomAddr,
      to: isOutgoing ? randomAddr : address,
      value,
      valueFormatted: formatValue(value, chain.decimals),
      fee,
      feeFormatted: formatValue(fee, chain.decimals),
      status,
      type,
      chainId: chain.id,
      chainName: chain.name,
      symbol: chain.symbol,
      method: type === 'contract' ? 'swap' : undefined,
      explorerUrl: `${chain.explorerUrl}/tx/${hash}`,
    };
  });
}

// Main fetch function - routes to correct API based on chain type
export async function fetchTransactions(
  address: string,
  chainId: string,
  page = 1,
  limit = 50,
  useMock = false
): Promise<TransactionResponse> {
  const chain = getChainById(chainId);
  if (!chain) {
    throw new Error(`Chain ${chainId} not found`);
  }

  // For demo purposes or when APIs require keys, use mock data
  if (useMock) {
    const mockTxs = generateMockTransactions(address, chain, limit);
    return {
      transactions: mockTxs,
      totalCount: 100,
      page,
      limit,
      hasMore: page < 4,
    };
  }

  // Route to specific chain APIs
  switch (chain.id) {
    case 'bitcoin':
      return await fetchBitcoinTransactions(address, chain, page, limit);
    case 'tron':
      return await fetchTronTransactions(address, chain, page, limit);
    case 'near':
      return await fetchNearTransactions(address, chain, page, limit);
    case 'sui':
      return await fetchSuiTransactions(address, chain, page, limit);
    case 'aptos':
      return await fetchAptosTransactions(address, chain, page, limit);
  }

  // Route by API type
  switch (chain.apiType) {
    case 'etherscan':
      return await fetchEVMTransactions(address, chain, page, limit);
    case 'subscan':
      return await fetchSubstrateTransactions(address, chain, page, limit);
    case 'solscan':
      return await fetchSolanaTransactions(address, chain, page, limit);
    case 'mintscan':
      return await fetchCosmosTransactions(address, chain, page, limit);
    case 'custom':
    default: {
      // For chains without implemented APIs, throw informative error
      throw new Error(`${chain.name} API not yet implemented. Check back soon!`);
    }
  }
}
