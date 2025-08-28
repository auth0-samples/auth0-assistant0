import { UserPlus, Unlink, Loader2, ExternalLink, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface LinkedIdentity {
  connection: string;
  provider: string;
  user_id: string;
  isSocial: boolean;
  profileData?: {
    email?: string;
    name?: string;
    picture?: string;
    username?: string;
  };
}

interface LinkedAccountsCardProps {
  linkedAccounts: LinkedIdentity[];
  loading: boolean;
  idTokenHint: string;
  onUnlinkAccount: (provider: string, userId: string) => void;
}

// Provider configurations with icons and display names
const PROVIDERS = {
  google: {
    name: 'Google',
    icon: '🔗',
    color: 'text-red-400',
    bgColor: 'bg-red-100/10',
    id: 'google-oauth2',
  },
  github: {
    name: 'GitHub',
    icon: '🔗',
    color: 'text-gray-400',
    bgColor: 'bg-gray-100/10',
    id: 'github',
  },
} as const;

function getProviderInfo(provider: string) {
  return PROVIDERS[provider as keyof typeof PROVIDERS];
}

function ProviderIcon({ provider, className = 'h-6 w-6' }: { provider: string; className?: string }) {
  const info = getProviderInfo(provider);
  return (
    <div className={`${info.bgColor} ${info.color} rounded-full p-2 flex items-center justify-center ${className}`}>
      <span className="text-sm">{info.icon}</span>
    </div>
  );
}

export default function LinkedAccountsCard({
  linkedAccounts,
  loading,
  idTokenHint,
  onUnlinkAccount,
}: LinkedAccountsCardProps) {
  const availableProviders = Object.keys(PROVIDERS).filter(
    (provider) => !linkedAccounts.some((account) => account.provider === provider) && provider !== 'auth0',
  );

  const generateAccountLinkingHref = (requestedConnection: string) => {
    const authParams = new URLSearchParams({
      scope: 'link_account openid profile offline_access',
      requested_connection: requestedConnection,
      id_token_hint: idTokenHint,
    }).toString();

    return `/auth/login?${authParams}`;
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Linked Accounts</h2>
        <span className="text-sm text-white/60">{linkedAccounts.length} connected</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-white/60" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Current Linked Accounts */}
          {linkedAccounts.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-white/80 uppercase tracking-wide">Connected Accounts</h3>
              {linkedAccounts.map((account) => {
                const providerInfo = getProviderInfo(account.provider);
                const isPrimary = account.provider === 'auth0' || !account.isSocial;

                return (
                  <div
                    key={`${account.provider}-${account.user_id}`}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center space-x-3">
                      <ProviderIcon provider={account.provider} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white">{providerInfo.name}</p>
                          {isPrimary && (
                            <span title="Primary account">
                              <Shield className="h-3 w-3 text-green-400" />
                            </span>
                          )}
                        </div>
                        {account.profileData?.email && (
                          <p className="text-xs text-white/60">{account.profileData.email}</p>
                        )}
                        {account.profileData?.name && account.profileData.name !== account.profileData.email && (
                          <p className="text-xs text-white/60">{account.profileData.name}</p>
                        )}
                      </div>
                    </div>

                    {!isPrimary && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUnlinkAccount(account.provider, account.user_id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      >
                        <Unlink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <UserPlus className="h-12 w-12 text-white/40 mx-auto mb-3" />
              <p className="text-white/60">No additional accounts linked</p>
            </div>
          )}

          {/* Available Providers to Link */}
          {availableProviders.length > 0 && (
            <div className="border-t border-white/20 pt-6">
              <h3 className="text-sm font-medium text-white/80 uppercase tracking-wide mb-3">
                Link Additional Accounts
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableProviders.map((provider) => {
                  const providerInfo = getProviderInfo(provider);
                  return (
                    <Button
                      key={provider}
                      asChild
                      variant="ghost"
                      className="flex flex-col items-center space-y-2 p-4 h-auto bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20"
                    >
                      <a href={generateAccountLinkingHref(providerInfo.id)} className="flex items-center gap-2">
                        <ProviderIcon provider={provider} />
                        <span className="text-xs text-white/80">{providerInfo.name}</span>
                      </a>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Information Box */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-6">
            <div className="flex items-start space-x-3">
              <ExternalLink className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-100 font-medium mb-1">
                  <a href="https://auth0.com/ai/docs/intro/account-linking" target="_blank" rel="noopener noreferrer">
                    Account Linking
                  </a>
                </p>
                <p className="text-blue-200/80 text-xs leading-relaxed">
                  Link social accounts to sign in with multiple providers using the same profile. Your primary account
                  cannot be unlinked.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
