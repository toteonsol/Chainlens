import { useState, useCallback } from 'react';
import { Github, Zap, Shield, Globe, ArrowRight, Sparkles, Layers } from 'lucide-react';
import { ChainSelector, WalletInput } from '@/components/explorer/WalletInput';
import { TransactionTable } from '@/components/explorer/TransactionTable';
import { ApiStatusInfo } from '@/components/explorer/ApiStatusInfo';
import { ApiKeyManager } from '@/components/explorer/ApiKeyManager';
import { CHAINS, type ChainConfig } from '@/lib/chains';
import { fetchTransactions } from '@/lib/transactions';
import type { Transaction } from '@/lib/types';
import { cn } from '@/lib/utils';

// Helper to generate user-friendly error messages with guidance
function getErrorGuidance(error: string, chain: ChainConfig | null): { message: string; suggestion: string } {
  const errorLower = error.toLowerCase();

  // Rate limit errors
  if (errorLower.includes('rate limit') || errorLower.includes('max rate limit') || errorLower.includes('too many')) {
    return {
      message: 'Rate limit exceeded',
      suggestion: chain?.apiKeyEnvVar
        ? `Add a free API key (${chain.apiKeyEnvVar}) in the ENV tab for higher limits, or wait a minute and try again.`
        : 'Please wait a minute and try again.',
    };
  }

  // API key required
  if (errorLower.includes('api key') || errorLower.includes('authentication') || errorLower.includes('helius')) {
    if (chain?.id === 'solana') {
      return {
        message: 'Solana requires an API key',
        suggestion: 'Get a free Helius API key at helius.dev and add it as VITE_HELIUS_API_KEY in the ENV tab.',
      };
    }
    return {
      message: 'API key required',
      suggestion: chain?.apiKeyEnvVar
        ? `Add ${chain.apiKeyEnvVar} in the ENV tab to enable this chain.`
        : 'This chain requires an API key. Check the API Status section below for details.',
    };
  }

  // Invalid address
  if (errorLower.includes('invalid') && errorLower.includes('address')) {
    return {
      message: 'Invalid wallet address',
      suggestion: `Make sure you're using the correct address format for ${chain?.name || 'this chain'}. Check the format hint below the input field.`,
    };
  }

  // No transactions
  if (errorLower.includes('no transaction') || errorLower.includes('not found')) {
    return {
      message: 'No transactions found',
      suggestion: 'This address may be new or have no activity. Double-check the address and chain selection.',
    };
  }

  // Network errors
  if (errorLower.includes('network') || errorLower.includes('fetch') || errorLower.includes('cors') || errorLower.includes('failed to fetch')) {
    return {
      message: 'Network error',
      suggestion: 'The API may be temporarily unavailable. Try again in a few seconds, or try a different chain.',
    };
  }

  // Timeout
  if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
    return {
      message: 'Request timed out',
      suggestion: 'The request took too long. This may happen with very active wallets. Try again or reduce the date range.',
    };
  }

  // Default
  return {
    message: error,
    suggestion: 'Try again, or check the API Status section for more information about this chain.',
  };
}

export default function Index() {
  const [selectedChain, setSelectedChain] = useState<ChainConfig | null>(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const handleExplore = useCallback(async (page = 1, limit = itemsPerPage) => {
    if (!selectedChain || !walletAddress) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setCurrentPage(page);

    try {
      // Use real blockchain data
      const response = await fetchTransactions(walletAddress, selectedChain.id, page, limit, false);
      setTransactions(response.transactions);
      setTotalCount(response.totalCount);
      setHasMore(response.hasMore);

      // If no transactions but no error, set a helpful message
      if (response.transactions.length === 0) {
        setError('No transactions found for this address');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch transactions';
      setError(errorMsg);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedChain, walletAddress, itemsPerPage]);

  const handlePageChange = useCallback((page: number) => {
    handleExplore(page, itemsPerPage);
  }, [handleExplore, itemsPerPage]);

  const handleItemsPerPageChange = useCallback((limit: number) => {
    setItemsPerPage(limit);
    handleExplore(1, limit);
  }, [handleExplore]);

  const enabledChains = CHAINS.filter(c => c.enabled);

  // Get error guidance if there's an error
  const errorGuidance = error ? getErrorGuidance(error, selectedChain) : null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Primary glow */}
        <div
          className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px]"
          style={{ background: 'radial-gradient(circle, hsl(175, 85%, 55%) 0%, transparent 70%)' }}
        />
        {/* Accent glow */}
        <div
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full opacity-15 blur-[100px]"
          style={{ background: 'radial-gradient(circle, hsl(265, 80%, 65%) 0%, transparent 70%)' }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(210, 20%, 98%) 1px, transparent 1px), linear-gradient(90deg, hsl(210, 20%, 98%) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Layers className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-primary to-accent opacity-30 blur-sm -z-10" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">ChainLens</h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Transaction Explorer</p>
              </div>
            </div>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center gap-6">
              <span className="text-sm text-muted-foreground">{enabledChains.length} Chains Supported</span>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
                  'bg-secondary/50 border border-border',
                  'hover:bg-secondary transition-colors'
                )}
              >
                <Github className="w-4 h-4" />
                Open Source
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        {!hasSearched && (
          <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">Multi-Chain Support</span>
              </div>

              {/* Heading */}
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in-up">
                <span className="text-foreground">Explore </span>
                <span className="gradient-text">Blockchain</span>
                <br />
                <span className="text-foreground">Transactions</span>
              </h2>

              {/* Subheading */}
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12 animate-fade-in-up stagger-2">
                View and export transactions from {enabledChains.length}+ blockchain networks.
                Perfect for tax reporting, portfolio tracking, and transaction analysis.
              </p>

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-16">
                {[
                  { icon: Globe, label: `${enabledChains.length}+ Chains`, desc: 'Multi-chain support' },
                  { icon: Zap, label: 'Instant Export', desc: 'Awakens CSV format' },
                  { icon: Shield, label: 'Privacy First', desc: 'No data stored' },
                ].map((feature, i) => (
                  <div
                    key={feature.label}
                    className={cn(
                      'p-4 rounded-xl bg-card/50 border border-border',
                      'card-hover animate-fade-in-up',
                      `stagger-${i + 3}`
                    )}
                  >
                    <feature.icon className="w-5 h-5 text-primary mb-2" />
                    <div className="font-medium text-foreground text-sm">{feature.label}</div>
                    <div className="text-xs text-muted-foreground">{feature.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Search Section */}
        <section className={cn('px-4 sm:px-6 lg:px-8', hasSearched ? 'pt-8 pb-4' : 'pb-16')}>
          <div className="max-w-2xl mx-auto">
            <div className={cn(
              'p-6 rounded-2xl',
              'bg-card/50 border border-border',
              'glass-strong',
              hasSearched ? '' : 'glow-primary'
            )}>
              <div className="space-y-4">
                {/* Chain Selector */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Select Blockchain
                  </label>
                  <ChainSelector
                    selectedChain={selectedChain}
                    onChainSelect={setSelectedChain}
                    address={walletAddress}
                    disabled={isLoading}
                  />
                </div>

                {/* Wallet Input */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Wallet Address
                  </label>
                  <WalletInput
                    value={walletAddress}
                    onChange={setWalletAddress}
                    onSubmit={handleExplore}
                    isLoading={isLoading}
                    selectedChain={selectedChain}
                    error={errorGuidance ? undefined : undefined}
                  />
                </div>

                {/* Error Message with Guidance */}
                {errorGuidance && hasSearched && !isLoading && (
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 animate-fade-in">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center shrink-0">
                        <span className="text-destructive text-lg">!</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground mb-1">{errorGuidance.message}</h4>
                        <p className="text-sm text-muted-foreground">{errorGuidance.suggestion}</p>
                        {selectedChain?.apiStatus === 'key_required' && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Required: <code className="text-primary bg-primary/10 px-1 rounded">{selectedChain.apiKeyEnvVar}</code>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Results Section */}
        {hasSearched && (
          <section className="px-4 sm:px-6 lg:px-8 pb-16 animate-fade-in-up">
            <div className="max-w-7xl mx-auto">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  {selectedChain && (
                    <div className="flex items-center gap-3">
                      <span
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                        style={{ backgroundColor: `${selectedChain.color}20`, color: selectedChain.color }}
                      >
                        {selectedChain.icon}
                      </span>
                      <div>
                        <h3 className="font-semibold text-foreground">{selectedChain.name}</h3>
                        <p className="text-xs text-muted-foreground font-mono">
                          {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {!isLoading && transactions.length > 0 && (
                  <button
                    onClick={() => {
                      setHasSearched(false);
                      setTransactions([]);
                      setWalletAddress('');
                      setSelectedChain(null);
                      setCurrentPage(1);
                      setTotalCount(0);
                    }}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm',
                      'border border-border hover:bg-secondary/50 transition-colors'
                    )}
                  >
                    New Search
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Transaction Table */}
              {selectedChain && (
                <TransactionTable
                  transactions={transactions}
                  walletAddress={walletAddress}
                  chain={selectedChain}
                  isLoading={isLoading}
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                  totalCount={totalCount}
                  hasMore={hasMore}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              )}
            </div>
          </section>
        )}

        {/* Supported Chains Section */}
        {!hasSearched && (
          <section className="px-4 sm:px-6 lg:px-8 pb-12">
            <div className="max-w-5xl mx-auto">
              <h3 className="text-center text-sm font-medium text-muted-foreground uppercase tracking-widest mb-8">
                Supported Blockchains
              </h3>
              <div className="flex flex-wrap justify-center gap-3">
                {enabledChains.slice(0, 20).map((chain, i) => (
                  <button
                    key={chain.id}
                    onClick={() => setSelectedChain(chain)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg',
                      'bg-card/50 border border-border',
                      'hover:border-primary/30 hover:bg-card transition-all',
                      'animate-fade-in',
                      selectedChain?.id === chain.id && 'border-primary/50 bg-primary/5'
                    )}
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <span
                      className="w-6 h-6 rounded-md flex items-center justify-center text-sm"
                      style={{ backgroundColor: `${chain.color}20`, color: chain.color }}
                    >
                      {chain.icon}
                    </span>
                    <span className="text-sm text-foreground">{chain.name}</span>
                  </button>
                ))}
                {enabledChains.length > 20 && (
                  <div className="flex items-center px-3 py-2 text-sm text-muted-foreground">
                    +{enabledChains.length - 20} more
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* API Status Section */}
        {!hasSearched && (
          <section className="px-4 sm:px-6 lg:px-8 pb-20">
            <div className="max-w-4xl mx-auto space-y-4">
              <ApiKeyManager />
              <ApiStatusInfo />
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 bg-card/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground">ChainLens</span>
              <span className="text-xs text-muted-foreground">by Awakens</span>
            </div>
            <div className="text-xs text-muted-foreground text-center sm:text-right">
              Export transactions to Awakens CSV format for seamless tax reporting.
              <br className="hidden sm:block" />
              <span className="text-muted-foreground/70">Privacy first - no data stored on our servers.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
