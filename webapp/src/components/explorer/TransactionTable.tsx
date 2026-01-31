import React, { useState, useMemo } from 'react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  ExternalLink,
  Copy,
  Check,
  ChevronUp,
  ChevronDown,
  Filter,
  X,
  Download,
  Search,
  Info,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import type { Transaction, SortField, SortDirection, TableFilters } from '@/lib/types';
import type { ChainConfig } from '@/lib/chains';
import { cn } from '@/lib/utils';
import { downloadCSV } from '@/lib/csv-export';
import { getKnownContract, getMethodInfo, CONTRACT_TYPE_CONFIG } from '@/lib/known-contracts';

interface TransactionTableProps {
  transactions: Transaction[];
  walletAddress: string;
  chain: ChainConfig;
  isLoading?: boolean;
  currentPage: number;
  itemsPerPage: number;
  totalCount: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (limit: number) => void;
}

export function TransactionTable({
  transactions,
  walletAddress,
  chain,
  isLoading,
  currentPage,
  itemsPerPage,
  totalCount,
  hasMore,
  onPageChange,
  onItemsPerPageChange,
}: TransactionTableProps) {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filters, setFilters] = useState<TableFilters>({
    type: [],
    status: [],
    dateRange: { start: null, end: null },
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Toggle row expansion
  const toggleRowExpansion = (hash: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(hash)) {
        newSet.delete(hash);
      } else {
        newSet.add(hash);
      }
      return newSet;
    });
  };

  // Copy hash to clipboard
  const copyToClipboard = async (text: string, type: 'hash' | 'address' = 'hash') => {
    await navigator.clipboard.writeText(text);
    if (type === 'hash') {
      setCopiedHash(text);
      setTimeout(() => setCopiedHash(null), 2000);
    } else {
      setCopiedAddress(text);
      setTimeout(() => setCopiedAddress(null), 2000);
    }
  };

  // Format timestamp
  const formatDate = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Truncate address
  const truncateAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Get transaction type info
  const getTypeInfo = (tx: Transaction) => {
    const isOutgoing = tx.from.toLowerCase() === walletAddress.toLowerCase();
    const typeConfig: Record<string, { label: string; color: string; icon: 'out' | 'in' }> = {
      transfer: {
        label: isOutgoing ? 'Send' : 'Receive',
        color: isOutgoing ? 'text-orange-400' : 'text-emerald-400',
        icon: isOutgoing ? 'out' : 'in',
      },
      contract: {
        label: tx.method || 'Contract',
        color: 'text-violet-400',
        icon: isOutgoing ? 'out' : 'in',
      },
      token: {
        label: 'Token Transfer',
        color: 'text-blue-400',
        icon: isOutgoing ? 'out' : 'in',
      },
      stake: {
        label: 'Stake',
        color: 'text-cyan-400',
        icon: 'out',
      },
      unstake: {
        label: 'Unstake',
        color: 'text-amber-400',
        icon: 'in',
      },
      swap: {
        label: 'Swap',
        color: 'text-purple-400',
        icon: 'out',
      },
      reward: {
        label: 'Reward',
        color: 'text-emerald-400',
        icon: 'in',
      },
      nft: {
        label: 'NFT',
        color: 'text-pink-400',
        icon: isOutgoing ? 'out' : 'in',
      },
      internal: {
        label: 'Internal',
        color: 'text-muted-foreground',
        icon: isOutgoing ? 'out' : 'in',
      },
      other: {
        label: 'Other',
        color: 'text-muted-foreground',
        icon: isOutgoing ? 'out' : 'in',
      },
    };
    return typeConfig[tx.type] || typeConfig.other;
  };

  // Filter and sort transactions
  const processedTransactions = useMemo(() => {
    let result = [...transactions];

    // Apply filters
    if (filters.type.length > 0) {
      result = result.filter(tx => filters.type.includes(tx.type));
    }
    if (filters.status.length > 0) {
      result = result.filter(tx => filters.status.includes(tx.status));
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        tx =>
          tx.hash.toLowerCase().includes(search) ||
          tx.from.toLowerCase().includes(search) ||
          tx.to.toLowerCase().includes(search)
      );
    }

    // Apply date range filter
    if (filters.dateRange.start) {
      const startTs = new Date(filters.dateRange.start).getTime() / 1000;
      result = result.filter(tx => parseInt(tx.timestamp) >= startTs);
    }
    if (filters.dateRange.end) {
      const endTs = new Date(filters.dateRange.end).getTime() / 1000 + 86400; // End of day
      result = result.filter(tx => parseInt(tx.timestamp) <= endTs);
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'timestamp':
          comparison = parseInt(a.timestamp) - parseInt(b.timestamp);
          break;
        case 'value':
          comparison = parseFloat(a.valueFormatted) - parseFloat(b.valueFormatted);
          break;
        case 'fee':
          comparison = parseFloat(a.feeFormatted) - parseFloat(b.feeFormatted);
          break;
        case 'blockNumber':
          comparison = parseInt(a.blockNumber) - parseInt(b.blockNumber);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [transactions, filters, sortField, sortDirection]);

  // Unique types for filter
  const uniqueTypes = useMemo(() => {
    const types = new Set(transactions.map(tx => tx.type));
    return Array.from(types);
  }, [transactions]);

  // Toggle sort
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Sort indicator
  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5" />
    );
  };

  // Handle download
  const handleDownload = () => {
    downloadCSV(processedTransactions, walletAddress, chain.name);
  };

  if (isLoading) {
    return <TransactionTableSkeleton />;
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
          <Search className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No transactions found</h3>
        <p className="text-muted-foreground text-sm">
          This address doesn't have any transactions on {chain.name} yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            <span className="text-foreground font-medium">{processedTransactions.length}</span> transactions
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm',
              'border border-border hover:bg-secondary/50 transition-colors',
              showFilters && 'bg-secondary/50 border-primary/30'
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
            {(filters.type.length > 0 || filters.status.length > 0 || filters.search) && (
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {filters.type.length + filters.status.length + (filters.search ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={handleDownload}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
            'bg-primary text-primary-foreground',
            'hover:opacity-90 transition-opacity'
          )}
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Filters</h4>
            <button
              onClick={() => setFilters({ type: [], status: [], dateRange: { start: null, end: null }, search: '' })}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear all
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Hash or address..."
                className={cn(
                  'w-full px-3 py-2 rounded-lg text-sm',
                  'bg-background border border-border',
                  'focus:outline-none focus:border-primary/50'
                )}
              />
            </div>

            {/* Date Range */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Date Range</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filters.dateRange.start || ''}
                  onChange={e => setFilters(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, start: e.target.value || null }
                  }))}
                  className={cn(
                    'flex-1 px-2 py-2 rounded-lg text-sm min-w-0',
                    'bg-background border border-border',
                    'focus:outline-none focus:border-primary/50'
                  )}
                />
                <input
                  type="date"
                  value={filters.dateRange.end || ''}
                  onChange={e => setFilters(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, end: e.target.value || null }
                  }))}
                  className={cn(
                    'flex-1 px-2 py-2 rounded-lg text-sm min-w-0',
                    'bg-background border border-border',
                    'focus:outline-none focus:border-primary/50'
                  )}
                />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Transaction Type</label>
              <div className="flex flex-wrap gap-1.5">
                {uniqueTypes.map(type => (
                  <button
                    key={type}
                    onClick={() =>
                      setFilters(prev => ({
                        ...prev,
                        type: prev.type.includes(type)
                          ? prev.type.filter(t => t !== type)
                          : [...prev.type, type],
                      }))
                    }
                    className={cn(
                      'px-2 py-1 rounded text-xs capitalize transition-colors',
                      filters.type.includes(type)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Status</label>
              <div className="flex flex-wrap gap-1.5">
                {['success', 'failed', 'pending'].map(status => (
                  <button
                    key={status}
                    onClick={() =>
                      setFilters(prev => ({
                        ...prev,
                        status: prev.status.includes(status)
                          ? prev.status.filter(s => s !== status)
                          : [...prev.status, status],
                      }))
                    }
                    className={cn(
                      'px-2 py-1 rounded text-xs capitalize transition-colors',
                      filters.status.includes(status)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table - Desktop */}
      <div className="rounded-xl border border-border overflow-hidden bg-card/50 hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => toggleSort('timestamp')}
                    className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground uppercase tracking-wider"
                  >
                    Date
                    <SortIndicator field="timestamp" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Hash
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  From / To
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => toggleSort('value')}
                    className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground uppercase tracking-wider ml-auto"
                  >
                    Amount
                    <SortIndicator field="value" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => toggleSort('fee')}
                    className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground uppercase tracking-wider ml-auto"
                  >
                    Fee
                    <SortIndicator field="fee" />
                  </button>
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Link
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {processedTransactions.map((tx, index) => {
                const typeInfo = getTypeInfo(tx);
                const isOutgoing = tx.from.toLowerCase() === walletAddress.toLowerCase();
                const isExpanded = expandedRows.has(tx.hash);

                // Get known contract info
                const toContract = getKnownContract(chain.id, tx.to);
                const fromContract = getKnownContract(chain.id, tx.from);
                const methodInfo = tx.input ? getMethodInfo(tx.input) : null;

                // Determine action label
                let actionLabel = typeInfo.label;
                if (methodInfo && tx.type === 'contract') {
                  actionLabel = methodInfo.action;
                } else if (tx.method) {
                  actionLabel = tx.method;
                }

                return (
                  <React.Fragment key={tx.hash + index}>
                    <tr
                      className={cn(
                        'table-row-hover cursor-pointer',
                        isExpanded && 'bg-muted/30'
                      )}
                      style={{ animationDelay: `${index * 20}ms` }}
                      onClick={() => toggleRowExpansion(tx.hash)}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <ChevronRight
                            className={cn(
                              'w-4 h-4 text-muted-foreground transition-transform',
                              isExpanded && 'rotate-90'
                            )}
                          />
                          <div>
                            <div className="text-sm text-foreground">{formatDate(tx.timestamp)}</div>
                            <div className="text-xs text-muted-foreground">Block #{tx.blockNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              'w-7 h-7 rounded-lg flex items-center justify-center',
                              typeInfo.icon === 'out' ? 'bg-orange-500/10' : 'bg-emerald-500/10'
                            )}
                          >
                            {typeInfo.icon === 'out' ? (
                              <ArrowUpRight className="w-4 h-4 text-orange-400" />
                            ) : (
                              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                            )}
                          </div>
                          <div>
                            <span className={cn('text-sm font-medium', typeInfo.color)}>
                              {actionLabel}
                            </span>
                            {toContract && tx.type === 'contract' && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className={cn('text-[10px] font-medium', CONTRACT_TYPE_CONFIG[toContract.type]?.color || 'text-muted-foreground')}>
                                  {toContract.name}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <code className="text-sm text-foreground font-mono">
                            {truncateAddress(tx.hash)}
                          </code>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(tx.hash, 'hash');
                            }}
                            className="p-1 rounded hover:bg-muted/50 transition-colors"
                          >
                            {copiedHash === tx.hash ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">From:</span>
                            <code className={cn('text-xs font-mono', isOutgoing ? 'text-foreground' : 'text-muted-foreground')}>
                              {fromContract ? (
                                <span className="text-blue-400" title={fromContract.name}>{fromContract.name}</span>
                              ) : (
                                truncateAddress(tx.from)
                              )}
                            </code>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">To:</span>
                            <code className={cn('text-xs font-mono', !isOutgoing ? 'text-foreground' : 'text-muted-foreground')}>
                              {toContract ? (
                                <span className="text-blue-400" title={toContract.name}>{toContract.name}</span>
                              ) : (
                                truncateAddress(tx.to)
                              )}
                            </code>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className={cn('text-sm font-medium', isOutgoing ? 'text-orange-400' : 'text-emerald-400')}>
                          {isOutgoing ? '-' : '+'}{tx.valueFormatted}
                        </div>
                        <div className="text-xs text-muted-foreground">{tx.symbol}</div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="text-sm text-muted-foreground">{tx.feeFormatted}</div>
                        <div className="text-xs text-muted-foreground/70">{tx.symbol}</div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={cn(
                            'inline-flex px-2 py-0.5 rounded text-xs font-medium',
                            tx.status === 'success' && 'bg-emerald-500/10 text-emerald-400',
                            tx.status === 'failed' && 'bg-red-500/10 text-red-400',
                            tx.status === 'pending' && 'bg-amber-500/10 text-amber-400'
                          )}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <a
                          href={tx.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary" />
                        </a>
                      </td>
                    </tr>

                    {/* Expanded Details Row */}
                    {isExpanded && (
                      <tr className="bg-muted/20">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                            {/* Transaction Hash */}
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground font-medium">Transaction Hash</div>
                              <div className="flex items-center gap-2">
                                <code className="text-xs font-mono text-foreground break-all">
                                  {tx.hash}
                                </code>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(tx.hash, 'hash');
                                  }}
                                  className="p-1 rounded hover:bg-muted/50 transition-colors shrink-0"
                                >
                                  {copiedHash === tx.hash ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* From Address */}
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground font-medium">From Address</div>
                              <div className="flex items-center gap-2">
                                <code className="text-xs font-mono text-foreground break-all">
                                  {tx.from}
                                </code>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(tx.from, 'address');
                                  }}
                                  className="p-1 rounded hover:bg-muted/50 transition-colors shrink-0"
                                >
                                  {copiedAddress === tx.from ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                                  )}
                                </button>
                              </div>
                              {fromContract && (
                                <div className="text-xs text-blue-400">{fromContract.name} ({fromContract.type})</div>
                              )}
                            </div>

                            {/* To Address */}
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground font-medium">To Address</div>
                              <div className="flex items-center gap-2">
                                <code className="text-xs font-mono text-foreground break-all">
                                  {tx.to}
                                </code>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(tx.to, 'address');
                                  }}
                                  className="p-1 rounded hover:bg-muted/50 transition-colors shrink-0"
                                >
                                  {copiedAddress === tx.to ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                                  )}
                                </button>
                              </div>
                              {toContract && (
                                <div className="text-xs text-blue-400">{toContract.name} ({toContract.type})</div>
                              )}
                            </div>

                            {/* Block Info */}
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground font-medium">Block</div>
                              <div className="text-foreground">#{tx.blockNumber}</div>
                            </div>

                            {/* Value Details */}
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground font-medium">Value</div>
                              <div className={cn('font-medium', isOutgoing ? 'text-orange-400' : 'text-emerald-400')}>
                                {tx.valueFormatted} {tx.symbol}
                              </div>
                            </div>

                            {/* Fee Details */}
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground font-medium">Transaction Fee</div>
                              <div className="text-foreground">{tx.feeFormatted} {tx.symbol}</div>
                              {tx.gasUsed && (
                                <div className="text-xs text-muted-foreground">
                                  Gas: {parseInt(tx.gasUsed).toLocaleString()}
                                  {tx.gasPrice && ` @ ${(parseInt(tx.gasPrice) / 1e9).toFixed(2)} Gwei`}
                                </div>
                              )}
                            </div>

                            {/* Method/Action */}
                            {(tx.method || methodInfo) && (
                              <div className="space-y-1">
                                <div className="text-xs text-muted-foreground font-medium">Method</div>
                                <div className="text-foreground">
                                  {methodInfo ? methodInfo.action : tx.method}
                                </div>
                                {methodInfo && (
                                  <div className="text-xs text-muted-foreground font-mono">{methodInfo.name}</div>
                                )}
                              </div>
                            )}

                            {/* Nonce */}
                            {tx.nonce && (
                              <div className="space-y-1">
                                <div className="text-xs text-muted-foreground font-medium">Nonce</div>
                                <div className="text-foreground">{tx.nonce}</div>
                              </div>
                            )}

                            {/* Input Data Preview */}
                            {tx.input && tx.input !== '0x' && (
                              <div className="space-y-1 md:col-span-2 lg:col-span-3">
                                <div className="text-xs text-muted-foreground font-medium">Input Data</div>
                                <code className="text-xs font-mono text-muted-foreground break-all block max-h-20 overflow-y-auto">
                                  {tx.input.slice(0, 200)}{tx.input.length > 200 ? '...' : ''}
                                </code>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-3">
                            <a
                              href={tx.explorerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className={cn(
                                'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm',
                                'bg-primary/10 text-primary hover:bg-primary/20 transition-colors'
                              )}
                            >
                              <ExternalLink className="w-4 h-4" />
                              View on Explorer
                            </a>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-3">
        {processedTransactions.map((tx, index) => {
          const typeInfo = getTypeInfo(tx);
          const isOutgoing = tx.from.toLowerCase() === walletAddress.toLowerCase();
          const isExpanded = expandedRows.has(tx.hash);
          const toContract = getKnownContract(chain.id, tx.to);
          const methodInfo = tx.input ? getMethodInfo(tx.input) : null;

          let actionLabel = typeInfo.label;
          if (methodInfo && tx.type === 'contract') {
            actionLabel = methodInfo.action;
          } else if (tx.method) {
            actionLabel = tx.method;
          }

          return (
            <div
              key={tx.hash + index}
              className={cn(
                'rounded-xl border border-border bg-card/50 overflow-hidden',
                isExpanded && 'border-primary/30'
              )}
            >
              {/* Card Header - Always visible */}
              <button
                onClick={() => toggleRowExpansion(tx.hash)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                        typeInfo.icon === 'out' ? 'bg-orange-500/10' : 'bg-emerald-500/10'
                      )}
                    >
                      {typeInfo.icon === 'out' ? (
                        <ArrowUpRight className="w-5 h-5 text-orange-400" />
                      ) : (
                        <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className={cn('font-medium', typeInfo.color)}>{actionLabel}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(tx.timestamp)}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={cn('font-medium', isOutgoing ? 'text-orange-400' : 'text-emerald-400')}>
                      {isOutgoing ? '-' : '+'}{tx.valueFormatted}
                    </div>
                    <div className="text-xs text-muted-foreground">{tx.symbol}</div>
                  </div>
                </div>

                {/* Quick info row */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex px-2 py-0.5 rounded text-xs font-medium',
                        tx.status === 'success' && 'bg-emerald-500/10 text-emerald-400',
                        tx.status === 'failed' && 'bg-red-500/10 text-red-400',
                        tx.status === 'pending' && 'bg-amber-500/10 text-amber-400'
                      )}
                    >
                      {tx.status}
                    </span>
                    <span className="text-xs text-muted-foreground">Block #{tx.blockNumber}</span>
                  </div>
                  <ChevronRight
                    className={cn(
                      'w-4 h-4 text-muted-foreground transition-transform',
                      isExpanded && 'rotate-90'
                    )}
                  />
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4">
                  {/* Hash */}
                  <div>
                    <div className="text-xs text-muted-foreground font-medium mb-1">Transaction Hash</div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-foreground break-all flex-1">
                        {tx.hash}
                      </code>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(tx.hash, 'hash');
                        }}
                        className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors shrink-0"
                      >
                        {copiedHash === tx.hash ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* From */}
                  <div>
                    <div className="text-xs text-muted-foreground font-medium mb-1">From</div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-foreground break-all flex-1">
                        {tx.from}
                      </code>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(tx.from, 'address');
                        }}
                        className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors shrink-0"
                      >
                        {copiedAddress === tx.from ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* To */}
                  <div>
                    <div className="text-xs text-muted-foreground font-medium mb-1">To</div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-foreground break-all flex-1">
                        {tx.to}
                      </code>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(tx.to, 'address');
                        }}
                        className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors shrink-0"
                      >
                        {copiedAddress === tx.to ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                    {toContract && (
                      <div className="text-xs text-blue-400 mt-1">{toContract.name}</div>
                    )}
                  </div>

                  {/* Fee */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground font-medium">Fee</div>
                      <div className="text-sm text-foreground">{tx.feeFormatted} {tx.symbol}</div>
                    </div>
                    {tx.gasUsed && (
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground font-medium">Gas Used</div>
                        <div className="text-sm text-foreground">{parseInt(tx.gasUsed).toLocaleString()}</div>
                      </div>
                    )}
                  </div>

                  {/* View on Explorer */}
                  <a
                    href={tx.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      'flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium',
                      'bg-primary/10 text-primary hover:bg-primary/20 transition-colors'
                    )}
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on Explorer
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {transactions.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
          {/* Items per page */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <div className="flex gap-1">
              {[25, 50, 100, 200].map(limit => (
                <button
                  key={limit}
                  onClick={() => onItemsPerPageChange(limit)}
                  className={cn(
                    'px-2.5 py-1 rounded text-sm transition-colors',
                    itemsPerPage === limit
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  )}
                >
                  {limit}
                </button>
              ))}
            </div>
          </div>

          {/* Page info and navigation */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Page {currentPage} {totalCount > 0 && `of ~${Math.ceil(totalCount / itemsPerPage)}`}
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  currentPage === 1
                    ? 'text-muted-foreground/50 cursor-not-allowed'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
                title="First page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  currentPage === 1
                    ? 'text-muted-foreground/50 cursor-not-allowed'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={!hasMore}
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  !hasMore
                    ? 'text-muted-foreground/50 cursor-not-allowed'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onPageChange(Math.ceil(totalCount / itemsPerPage))}
                disabled={!hasMore}
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  !hasMore
                    ? 'text-muted-foreground/50 cursor-not-allowed'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
                title="Last page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TransactionTableSkeleton() {
  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card/50">
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="h-4 w-32 bg-muted rounded animate-pulse" />
      </div>
      <div className="divide-y divide-border/50">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="px-4 py-4 flex items-center gap-4">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            <div className="flex-1" />
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
            <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
