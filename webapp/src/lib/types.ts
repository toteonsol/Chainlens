// Transaction types for ChainLens

export interface Transaction {
  hash: string;
  blockNumber: string;
  timestamp: string;
  from: string;
  to: string;
  value: string;
  valueFormatted: string;
  fee: string;
  feeFormatted: string;
  status: 'success' | 'failed' | 'pending';
  type: 'transfer' | 'contract' | 'internal' | 'token' | 'nft' | 'stake' | 'unstake' | 'reward' | 'swap' | 'other';
  chainId: string;
  chainName: string;
  symbol: string;
  method?: string;
  tokenSymbol?: string;
  tokenAmount?: string;
  tokenDecimals?: number;
  nonce?: string;
  gasUsed?: string;
  gasPrice?: string;
  input?: string;
  explorerUrl: string;
}

export interface TransactionQueryParams {
  address: string;
  chainId: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export interface TransactionResponse {
  transactions: Transaction[];
  totalCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface AddressInfo {
  address: string;
  balance: string;
  balanceFormatted: string;
  transactionCount: number;
  chainId: string;
}

// Awakens CSV format
export interface AwakensCSVRow {
  Date: string;
  Type: string;
  'Sent Currency': string;
  'Sent Amount': string;
  'Sent Cost Basis': string;
  'Received Currency': string;
  'Received Amount': string;
  'Received Cost Basis': string;
  'Fee Currency': string;
  'Fee Amount': string;
  Description: string;
  TxHash: string;
  Blockchain: string;
  'Wallet Address': string;
}

export type SortField = 'timestamp' | 'value' | 'fee' | 'blockNumber';
export type SortDirection = 'asc' | 'desc';

export interface TableFilters {
  type: string[];
  status: string[];
  dateRange: {
    start: string | null;
    end: string | null;
  };
  search: string;
}

export interface TableSort {
  field: SortField;
  direction: SortDirection;
}
