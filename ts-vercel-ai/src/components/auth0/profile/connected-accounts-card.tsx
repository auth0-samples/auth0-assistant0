import { UserPlus, Loader2, ExternalLink } from 'lucide-react';
import { ConnectedAccount } from '@/lib/actions/profile';
import { format } from 'date-fns';

interface ConnectedAccountsCardProps {
  connectedAccounts: ConnectedAccount[];
  loading: boolean;
}

export default function ConnectedAccountsCard({ connectedAccounts, loading }: ConnectedAccountsCardProps) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Connected Accounts</h2>
        <span className="text-sm text-white/60">{connectedAccounts.length} connected</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-white/60" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Current Linked Accounts */}
          {connectedAccounts.length > 0 ? (
            <div className="space-y-3">
              {connectedAccounts.map((account) => {
                return (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="w-full">
                      <p className="text-sm font-medium text-white">{account.connection}</p>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex gap-4 text-xs text-white/60">
                          <span>
                            Created: {account.created_at && format(new Date(account.created_at), 'dd-MMM-yy HH:mm')}
                          </span>
                          <span>
                            Expires: {account.expires_at && format(new Date(account.expires_at), 'dd-MMM-yy HH:mm')}
                          </span>
                        </div>
                      </div>
                      {account.scopes && account.scopes.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/60">Scopes:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {account.scopes.map((scope) => (
                              <span
                                key={scope}
                                className="text-xs bg-white/10 px-2 py-0.5 rounded text-white/80 border border-white/5"
                              >
                                {scope}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <UserPlus className="h-12 w-12 text-white/40 mx-auto mb-3" />
              <p className="text-white/60">No additional accounts connected</p>
            </div>
          )}

          {/* Information Box */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-6">
            <div className="flex items-start space-x-3">
              <ExternalLink className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-100 font-medium mb-1">
                  <a
                    href="https://auth0.com/ai/docs/intro/token-vault#what-is-connected-accounts-for-token-vault"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Connected Accounts
                  </a>
                </p>
                <p className="text-blue-200/80 text-xs leading-relaxed">
                  Connect social accounts to sign in with multiple providers using the same profile. Your primary
                  account cannot be unlinked.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
