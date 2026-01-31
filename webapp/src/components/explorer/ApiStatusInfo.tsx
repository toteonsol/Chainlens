import { useState } from 'react';
import { Info, Check, AlertTriangle, Key, Clock, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { CHAINS, API_STATUS_INFO, type ApiStatus } from '@/lib/chains';
import { cn } from '@/lib/utils';

export function ApiStatusInfo() {
  const [isExpanded, setIsExpanded] = useState(false);

  const enabledChains = CHAINS.filter(c => c.enabled);
  const chainsByStatus = {
    free: enabledChains.filter(c => c.apiStatus === 'free'),
    rate_limited: enabledChains.filter(c => c.apiStatus === 'rate_limited'),
    key_optional: enabledChains.filter(c => c.apiStatus === 'key_optional'),
    key_required: enabledChains.filter(c => c.apiStatus === 'key_required'),
  };

  const statusIcons: Record<ApiStatus, React.ReactNode> = {
    free: <Check className="w-4 h-4" />,
    rate_limited: <Clock className="w-4 h-4" />,
    key_optional: <Info className="w-4 h-4" />,
    key_required: <Key className="w-4 h-4" />,
  };

  return (
    <div className="w-full">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl',
          'bg-card/50 border border-border',
          'hover:bg-card/80 transition-all',
          'text-left'
        )}
      >
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-primary" />
          <div>
            <span className="font-medium text-foreground">API Status & Rate Limits</span>
            <span className="text-muted-foreground text-sm ml-2">
              ({chainsByStatus.free.length} free, {chainsByStatus.key_required.length} need keys)
            </span>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4 animate-fade-in">
          {/* Status Legend */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.entries(API_STATUS_INFO) as [ApiStatus, typeof API_STATUS_INFO[ApiStatus]][]).map(([status, info]) => (
              <div
                key={status}
                className={cn(
                  'p-3 rounded-lg border',
                  'bg-card/30'
                )}
                style={{ borderColor: `${info.color}40` }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ color: info.color }}>{statusIcons[status]}</span>
                  <span className="font-medium text-sm" style={{ color: info.color }}>
                    {info.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{info.description}</p>
              </div>
            ))}
          </div>

          {/* Chains by Status */}
          <div className="space-y-4">
            {/* Free Chains */}
            <div className="p-4 rounded-xl bg-card/30 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Check className="w-4 h-4 text-green-500" />
                <h4 className="font-semibold text-foreground">Free Public APIs</h4>
                <span className="text-xs text-muted-foreground">({chainsByStatus.free.length} chains)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {chainsByStatus.free.map(chain => (
                  <div
                    key={chain.id}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-500/10 border border-green-500/20"
                  >
                    <span className="text-sm">{chain.icon}</span>
                    <span className="text-xs font-medium text-foreground">{chain.name}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                These chains work immediately without any configuration.
              </p>
            </div>

            {/* Rate Limited Chains */}
            <div className="p-4 rounded-xl bg-card/30 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-yellow-500" />
                <h4 className="font-semibold text-foreground">Rate Limited (Free Tier)</h4>
                <span className="text-xs text-muted-foreground">({chainsByStatus.rate_limited.length} chains)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {chainsByStatus.rate_limited.map(chain => (
                  <div
                    key={chain.id}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-yellow-500/10 border border-yellow-500/20"
                  >
                    <span className="text-sm">{chain.icon}</span>
                    <span className="text-xs font-medium text-foreground">{chain.name}</span>
                  </div>
                ))}
              </div>
              <div className="text-xs text-muted-foreground mt-3 space-y-2">
                <p>Works but may hit rate limits (30 calls/min). For higher limits, get a free Subscan API key:</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <a
                    href="https://support.subscan.io/#get-started"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Subscan API Docs <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href="https://pro.subscan.io/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Get Subscan Key <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-muted-foreground/80">
                  Add as <code className="text-primary bg-primary/10 px-1 rounded">VITE_SUBSCAN_API_KEY</code> in ENV tab
                </p>
              </div>
            </div>

            {/* Key Optional Chains */}
            <div className="p-4 rounded-xl bg-card/30 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-blue-500" />
                <h4 className="font-semibold text-foreground">API Key Optional</h4>
                <span className="text-xs text-muted-foreground">({chainsByStatus.key_optional.length} chains)</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {chainsByStatus.key_optional.map(chain => (
                  <div
                    key={chain.id}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/10 border border-blue-500/20"
                  >
                    <span className="text-sm">{chain.icon}</span>
                    <span className="text-xs font-medium text-foreground">{chain.name}</span>
                  </div>
                ))}
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Works without keys (5 calls/sec limit). For better performance, add free API keys:</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <a
                    href="https://etherscan.io/apis"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Etherscan <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href="https://polygonscan.com/apis"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Polygonscan <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href="https://bscscan.com/apis"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    BscScan <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Key Required Chains */}
            <div className="p-4 rounded-xl bg-card/30 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Key className="w-4 h-4 text-red-500" />
                <h4 className="font-semibold text-foreground">API Key Required</h4>
                <span className="text-xs text-muted-foreground">({chainsByStatus.key_required.length} chains)</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {chainsByStatus.key_required.map(chain => (
                  <div
                    key={chain.id}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/10 border border-red-500/20"
                  >
                    <span className="text-sm">{chain.icon}</span>
                    <span className="text-xs font-medium text-foreground">{chain.name}</span>
                    {chain.apiKeyEnvVar && (
                      <span className="text-[10px] text-muted-foreground">({chain.apiKeyEnvVar})</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                <p className="mb-2">These chains require API keys to function:</p>
                <ul className="space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="text-foreground font-medium">Solana:</span>
                    <a
                      href="https://dev.helius.xyz/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      Get free Helius API key <ExternalLink className="w-3 h-3" />
                    </a>
                    <span className="text-muted-foreground">- Add as <code className="text-primary">VITE_HELIUS_API_KEY</code></span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Fallback Info */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-semibold text-foreground mb-1">Automatic Fallbacks</h4>
                <p className="text-xs text-muted-foreground">
                  Many chains have backup API endpoints. If the primary API fails, the app will automatically
                  try fallback endpoints (like Blockscout) where available. Chains with fallbacks include:
                  Ethereum, Polygon, Arbitrum, Optimism, Base, Gnosis, Linea, and Cosmos chains.
                </p>
              </div>
            </div>
          </div>

          {/* Perp DEX Info */}
          <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/20">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-violet-400 mt-0.5" />
              <div>
                <h4 className="font-semibold text-foreground mb-2">About Perp DEXs (Variational, Extended Exchange, etc.)</h4>
                <div className="text-xs text-muted-foreground space-y-2">
                  <p>
                    <strong className="text-foreground">Perpetual DEXs</strong> like <span className="text-violet-400">Variational</span> and{' '}
                    <span className="text-violet-400">Extended Exchange</span> are <em>DeFi protocols/applications</em>,
                    not separate blockchain networks.
                  </p>
                  <p>
                    They run on top of existing chains (like Ethereum, Arbitrum, or Solana). To track your
                    transactions on these platforms:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li>Search for your wallet on the <strong className="text-foreground">underlying chain</strong> where you used the protocol</li>
                    <li>For example, if you used Variational on Arbitrum, search your wallet on Arbitrum</li>
                    <li>Contract interactions will show as "Contract Call" with the protocol name when recognized</li>
                  </ul>
                  <p className="mt-2">
                    <strong className="text-foreground">Popular perp DEXs by chain:</strong>
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-400">Arbitrum:</span>
                      <span>GMX, Vela, Vertex, Variational</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-400">Solana:</span>
                      <span>Drift, Jupiter Perps, Mango</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400">Base:</span>
                      <span>Extended Exchange, Synthetix Perps</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-red-400">Optimism:</span>
                      <span>Synthetix Perps, Kwenta</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
