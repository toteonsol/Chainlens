import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, Check, Sparkles, Loader2, AlertCircle, HelpCircle } from 'lucide-react';
import { CHAINS, CHAIN_CATEGORIES, detectChainFromAddress, type ChainConfig } from '@/lib/chains';
import { cn } from '@/lib/utils';

// Address format examples for each chain category
const ADDRESS_FORMAT_EXAMPLES: Record<string, { example: string; description: string }> = {
  ethereum: { example: '0x742d35Cc6634C0532925a3b844Bc9e7595f...', description: '42 character hex starting with 0x' },
  polygon: { example: '0x742d35Cc6634C0532925a3b844Bc9e7595f...', description: '42 character hex starting with 0x' },
  arbitrum: { example: '0x742d35Cc6634C0532925a3b844Bc9e7595f...', description: '42 character hex starting with 0x' },
  optimism: { example: '0x742d35Cc6634C0532925a3b844Bc9e7595f...', description: '42 character hex starting with 0x' },
  base: { example: '0x742d35Cc6634C0532925a3b844Bc9e7595f...', description: '42 character hex starting with 0x' },
  avalanche: { example: '0x742d35Cc6634C0532925a3b844Bc9e7595f...', description: '42 character hex starting with 0x' },
  bsc: { example: '0x742d35Cc6634C0532925a3b844Bc9e7595f...', description: '42 character hex starting with 0x' },
  fantom: { example: '0x742d35Cc6634C0532925a3b844Bc9e7595f...', description: '42 character hex starting with 0x' },
  gnosis: { example: '0x742d35Cc6634C0532925a3b844Bc9e7595f...', description: '42 character hex starting with 0x' },
  linea: { example: '0x742d35Cc6634C0532925a3b844Bc9e7595f...', description: '42 character hex starting with 0x' },
  zksync: { example: '0x742d35Cc6634C0532925a3b844Bc9e7595f...', description: '42 character hex starting with 0x' },
  polkadot: { example: '15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5', description: 'SS58 format (starts with 1)' },
  kusama: { example: 'HNZata7iMYWmk5RvZRTiAsSDhV8366zq2YGb3tLH5Upf74F', description: 'SS58 format' },
  bittensor: { example: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', description: 'SS58 format (starts with 5)' },
  vara: { example: 'kGkLEU3e3XXkJp2WK4eNpVmSab5xUNL9QtmLPh8QfCL2EgotW', description: 'SS58 format (Substrate address)' },
  solana: { example: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', description: 'Base58 encoded (32-44 chars)' },
  cosmos: { example: 'cosmos1g9v3zjt6rfkwm4s8sw9wu4jgz9me8pn27f8nyc', description: 'Bech32 format (cosmos1...)' },
  osmosis: { example: 'osmo1g9v3zjt6rfkwm4s8sw9wu4jgz9me8pn2ype6qy', description: 'Bech32 format (osmo1...)' },
  celestia: { example: 'celestia1g9v3zjt6rfkwm4s8sw9wu4jgz9me8pn2kcl8qr', description: 'Bech32 format (celestia1...)' },
  injective: { example: 'inj1g9v3zjt6rfkwm4s8sw9wu4jgz9me8pn2w5khq3', description: 'Bech32 format (inj1...)' },
  sui: { example: '0x7d20dcdb2bca4f508ea9613994683eb4e76e9cc555f...', description: '66 character hex starting with 0x' },
  aptos: { example: '0x1d8727df513fa2a8785d0834e40b34223daff1affc079...', description: '66 character hex starting with 0x' },
  near: { example: 'example.near or alice.testnet', description: 'Account name (lowercase, dots allowed)' },
  bitcoin: { example: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', description: 'Bech32 (bc1...) or Legacy (1... or 3...)' },
  tron: { example: 'TJCnKsPa7y5okkXvQAidZBzqx3QyQ6sxMW', description: '34 characters starting with T' },
};

interface ChainSelectorProps {
  selectedChain: ChainConfig | null;
  onChainSelect: (chain: ChainConfig) => void;
  address?: string;
  disabled?: boolean;
}

export function ChainSelector({ selectedChain, onChainSelect, address, disabled }: ChainSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  // Update dropdown position when opened or on scroll/resize
  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const updatePosition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 8,
          left: rect.left,
          width: rect.width,
        });
      }
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  // Auto-detect compatible chains based on address
  const compatibleChains = useMemo(() => {
    if (!address) return CHAINS.filter(c => c.enabled);
    return detectChainFromAddress(address);
  }, [address]);

  // Filter chains by search
  const filteredChains = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return compatibleChains.filter(
      chain =>
        chain.name.toLowerCase().includes(query) ||
        chain.symbol.toLowerCase().includes(query) ||
        chain.id.toLowerCase().includes(query)
    );
  }, [compatibleChains, searchQuery]);

  // Group chains by category
  const groupedChains = useMemo(() => {
    const groups = new Map<string, ChainConfig[]>();
    CHAIN_CATEGORIES.forEach(cat => groups.set(cat.id, []));

    filteredChains.forEach(chain => {
      const categoryChains = groups.get(chain.category) || [];
      categoryChains.push(chain);
      groups.set(chain.category, categoryChains);
    });

    return groups;
  }, [filteredChains]);

  return (
    <div className="relative">
      {/* Selector Button */}
      <button
        ref={buttonRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl',
          'bg-secondary/50 border border-border',
          'transition-all duration-200',
          'hover:bg-secondary/80 hover:border-primary/30',
          'focus:outline-none focus:ring-2 focus:ring-primary/30',
          disabled && 'opacity-50 cursor-not-allowed',
          isOpen && 'border-primary/50 ring-2 ring-primary/20'
        )}
      >
        {selectedChain ? (
          <>
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center text-lg font-medium"
              style={{ backgroundColor: `${selectedChain.color}20`, color: selectedChain.color }}
            >
              {selectedChain.icon}
            </span>
            <div className="flex-1 text-left">
              <div className="font-medium text-foreground">{selectedChain.name}</div>
              <div className="text-xs text-muted-foreground">{selectedChain.symbol}</div>
            </div>
          </>
        ) : (
          <>
            <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-muted-foreground" />
            </span>
            <div className="flex-1 text-left">
              <div className="font-medium text-muted-foreground">Select a blockchain</div>
              <div className="text-xs text-muted-foreground/70">{compatibleChains.length} chains available</div>
            </div>
          </>
        )}
        <ChevronDown
          className={cn(
            'w-5 h-5 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown rendered via portal */}
      {isOpen && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0"
            style={{ zIndex: 9998 }}
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div
            className="fixed rounded-xl overflow-hidden"
            style={{
              zIndex: 9999,
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              backgroundColor: '#1e3a4c',
              border: '2px solid #2dd4bf',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
            }}
          >
            {/* Search */}
            <div className="p-3 border-b border-teal-500/30" style={{ backgroundColor: '#1e3a4c' }}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-300/70" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search chains..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-white placeholder:text-teal-300/50 focus:outline-none focus:ring-2 focus:ring-teal-400/50"
                  style={{ backgroundColor: '#264653', border: '1px solid #2dd4bf50' }}
                  autoFocus
                />
              </div>
            </div>

            {/* Chain List */}
            <div
              className="max-h-80 overflow-y-auto p-2"
              style={{ backgroundColor: '#1e3a4c' }}
            >
              {CHAIN_CATEGORIES.map(category => {
                const chains = groupedChains.get(category.id) || [];
                if (chains.length === 0) return null;

                return (
                  <div key={category.id} className="mb-3 last:mb-0">
                    <div className="px-3 py-1.5 text-xs font-semibold text-teal-300 uppercase tracking-wider">
                      {category.name}
                    </div>
                    <div className="space-y-0.5">
                      {chains.map(chain => (
                        <button
                          key={chain.id}
                          onClick={() => {
                            onChainSelect(chain);
                            setIsOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 hover:bg-teal-600/30"
                          style={{
                            backgroundColor: selectedChain?.id === chain.id ? 'rgba(45, 212, 191, 0.3)' : 'transparent'
                          }}
                        >
                          <span
                            className="w-7 h-7 rounded-md flex items-center justify-center text-sm"
                            style={{ backgroundColor: `${chain.color}40`, color: chain.color }}
                          >
                            {chain.icon}
                          </span>
                          <div className="flex-1 text-left">
                            <div className="font-medium text-sm text-white">{chain.name}</div>
                          </div>
                          <span className="text-xs text-teal-200/70 font-mono">{chain.symbol}</span>
                          {selectedChain?.id === chain.id && (
                            <Check className="w-4 h-4 text-teal-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {filteredChains.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <div className="text-teal-200/70 text-sm">No chains found</div>
                  <div className="text-teal-200/50 text-xs mt-1">Try a different search term</div>
                </div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

interface WalletInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  selectedChain?: ChainConfig | null;
  error?: string;
}

export function WalletInput({ value, onChange, onSubmit, isLoading, selectedChain, error }: WalletInputProps) {
  const [showFormatHint, setShowFormatHint] = useState(false);

  const isValid = useMemo(() => {
    if (!value || !selectedChain) return true;
    return selectedChain.addressRegex.test(value);
  }, [value, selectedChain]);

  // Get format info for current chain
  const formatInfo = selectedChain ? ADDRESS_FORMAT_EXAMPLES[selectedChain.id] : null;

  // Detect if user entered wrong format (e.g., EVM address for Bittensor)
  const wrongFormatDetection = useMemo(() => {
    if (!value || !selectedChain || isValid) return null;

    // Check if it's an EVM address entered for non-EVM chain
    if (/^0x[a-fA-F0-9]{40}$/.test(value)) {
      const evmChains = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'avalanche', 'bsc', 'fantom', 'gnosis', 'linea', 'zksync'];
      if (!evmChains.includes(selectedChain.id)) {
        return `This looks like an EVM address. ${selectedChain.name} uses a different format.`;
      }
    }

    // Check if it's a Substrate address entered for EVM chain
    if (/^[1-9A-HJ-NP-Za-km-z]{47,48}$/.test(value) || /^5[a-zA-Z0-9]{47}$/.test(value)) {
      const evmChains = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'avalanche', 'bsc', 'fantom', 'gnosis', 'linea', 'zksync'];
      if (evmChains.includes(selectedChain.id)) {
        return `This looks like a Substrate/Polkadot address, not an EVM address.`;
      }
    }

    return null;
  }, [value, selectedChain, isValid]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value && selectedChain && isValid && !isLoading) {
      onSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative group">
        <div
          className={cn(
            'absolute -inset-0.5 rounded-xl opacity-0 blur transition-opacity duration-300',
            'bg-gradient-to-r from-primary via-accent to-primary',
            'group-focus-within:opacity-30'
          )}
        />
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={formatInfo ? `e.g. ${formatInfo.example.slice(0, 20)}...` : 'Enter wallet address...'}
            className={cn(
              'w-full px-5 py-4 pr-32 rounded-xl',
              'bg-secondary/50 border border-border',
              'text-foreground font-mono text-sm',
              'placeholder:text-muted-foreground placeholder:font-outfit',
              'focus:outline-none focus:border-primary/50',
              'transition-all duration-200',
              !isValid && value && 'border-destructive/50'
            )}
            spellCheck={false}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!value || !selectedChain || !isValid || isLoading}
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2',
              'px-5 py-2 rounded-lg font-medium text-sm',
              'bg-primary text-primary-foreground',
              'transition-all duration-200',
              'hover:opacity-90 hover:scale-[1.02]',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
              'flex items-center gap-2'
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Explore</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Address Format Hint */}
      {selectedChain && formatInfo && !value && (
        <div className="flex items-start gap-2 px-1 text-xs text-muted-foreground animate-fade-in">
          <HelpCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <div>
            <span className="font-medium text-foreground">{selectedChain.name} address format:</span>{' '}
            {formatInfo.description}
          </div>
        </div>
      )}

      {/* Error/Validation Message */}
      {(error || (!isValid && value)) && (
        <div className="flex items-start gap-2 text-sm text-destructive px-1 animate-fade-in">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <div>{error || `Invalid ${selectedChain?.name || 'wallet'} address format`}</div>
            {wrongFormatDetection && (
              <div className="text-xs text-muted-foreground mt-1">{wrongFormatDetection}</div>
            )}
            {formatInfo && !wrongFormatDetection && (
              <div className="text-xs text-muted-foreground mt-1">
                Expected format: {formatInfo.description}
              </div>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
