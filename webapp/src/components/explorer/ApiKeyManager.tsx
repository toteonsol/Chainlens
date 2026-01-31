import { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Save, Trash2, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApiKeyConfig {
  id: string;
  name: string;
  envVar: string;
  description: string;
  getKeyUrl: string;
}

const API_KEYS_CONFIG: ApiKeyConfig[] = [
  {
    id: 'etherscan',
    name: 'Etherscan',
    envVar: 'etherscan_api_key',
    description: 'For Ethereum, Polygon, Arbitrum, Optimism, Base, BSC, etc.',
    getKeyUrl: 'https://etherscan.io/apis',
  },
  {
    id: 'subscan',
    name: 'Subscan',
    envVar: 'subscan_api_key',
    description: 'For Polkadot, Kusama, Bittensor, Vara Network',
    getKeyUrl: 'https://pro.subscan.io/',
  },
  {
    id: 'helius',
    name: 'Helius',
    envVar: 'helius_api_key',
    description: 'For Solana (required)',
    getKeyUrl: 'https://dev.helius.xyz/',
  },
];

const STORAGE_KEY = 'chainlens_api_keys';

export function getStoredApiKey(keyId: string): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const keys = JSON.parse(stored);
    return keys[keyId] || null;
  } catch {
    return null;
  }
}

export function getAllStoredApiKeys(): Record<string, string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

export function ApiKeyManager() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [savedKeys, setSavedKeys] = useState<Record<string, boolean>>({});

  // Load keys from localStorage on mount
  useEffect(() => {
    const stored = getAllStoredApiKeys();
    setApiKeys(stored);
    // Mark existing keys as saved
    const saved: Record<string, boolean> = {};
    Object.keys(stored).forEach(key => {
      if (stored[key]) saved[key] = true;
    });
    setSavedKeys(saved);
  }, []);

  const handleSave = (keyId: string) => {
    try {
      const stored = getAllStoredApiKeys();
      stored[keyId] = apiKeys[keyId] || '';
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      setSavedKeys(prev => ({ ...prev, [keyId]: true }));
      // Reset saved indicator after 2 seconds
      setTimeout(() => {
        setSavedKeys(prev => ({ ...prev, [keyId]: false }));
      }, 2000);
    } catch (error) {
      console.error('Failed to save API key:', error);
    }
  };

  const handleDelete = (keyId: string) => {
    try {
      const stored = getAllStoredApiKeys();
      delete stored[keyId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      setApiKeys(prev => {
        const updated = { ...prev };
        delete updated[keyId];
        return updated;
      });
    } catch (error) {
      console.error('Failed to delete API key:', error);
    }
  };

  const hasAnyKeys = Object.values(apiKeys).some(key => key && key.length > 0);

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
          <Key className="w-5 h-5 text-primary" />
          <div>
            <span className="font-medium text-foreground">Manage API Keys</span>
            <span className="text-muted-foreground text-sm ml-2">
              {hasAnyKeys ? '(Keys configured)' : '(No keys set)'}
            </span>
          </div>
        </div>
        <span className="text-muted-foreground text-sm">
          {isExpanded ? '−' : '+'}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4 animate-fade-in">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <h4 className="font-semibold text-foreground mb-1">API Keys Storage</h4>
                <p className="text-xs text-muted-foreground">
                  Keys are stored in your browser's localStorage for convenience. They never leave your device
                  and are only used for API requests. For production use, consider using environment variables instead.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {API_KEYS_CONFIG.map(config => (
              <div
                key={config.id}
                className="p-4 rounded-xl bg-card/30 border border-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-foreground">{config.name}</h4>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                  </div>
                  <a
                    href={config.getKeyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    Get Key
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showKeys[config.id] ? 'text' : 'password'}
                      value={apiKeys[config.id] || ''}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, [config.id]: e.target.value }))}
                      placeholder="Enter API key..."
                      className={cn(
                        'w-full px-3 py-2 pr-10 rounded-lg text-sm font-mono',
                        'bg-background border border-border',
                        'focus:outline-none focus:border-primary/50',
                        'placeholder:text-muted-foreground'
                      )}
                    />
                    <button
                      onClick={() => setShowKeys(prev => ({ ...prev, [config.id]: !prev[config.id] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showKeys[config.id] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <button
                    onClick={() => handleSave(config.id)}
                    disabled={!apiKeys[config.id]}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      savedKeys[config.id]
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-primary/20 text-primary hover:bg-primary/30',
                      !apiKeys[config.id] && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {savedKeys[config.id] ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => handleDelete(config.id)}
                    disabled={!apiKeys[config.id]}
                    className={cn(
                      'p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors',
                      !apiKeys[config.id] && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
