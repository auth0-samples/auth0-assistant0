import { User, Calendar, Mail, Globe, Shield, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface KeyValueMap {
  [key: string]: any;
}

function getAvatarFallback(user: KeyValueMap) {
  const givenName = user.given_name;
  const familyName = user.family_name;
  const nickname = user.nickname;
  const name = user.name;

  if (givenName && familyName) {
    return `${givenName[0]}${familyName[0]}`;
  }

  if (nickname) {
    return nickname[0];
  }

  return name?.[0] || 'U';
}

function formatDate(dateString: string | undefined) {
  if (!dateString) return 'N/A';

  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'N/A';
  }
}

export default function UserInfoCard({ user }: { user: KeyValueMap }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
      <div className="flex flex-col items-center space-y-4">
        {/* Avatar */}
        <Avatar className="h-24 w-24">
          <AvatarImage src={user.picture} alt={user.name} />
          <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
            {getAvatarFallback(user)}
          </AvatarFallback>
        </Avatar>

        {/* Basic Info */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-white">{user.name || user.nickname || 'User'}</h2>
          {user.email && (
            <p className="text-white/70 flex items-center gap-2 justify-center">
              <Mail className="h-4 w-4" />
              {user.email}
              {user.email_verified && (
                <span title="Verified">
                  <Shield className="h-4 w-4 text-green-400" />
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Detailed Information */}
      <div className="mt-6 space-y-4">
        <div className="border-t border-white/20 pt-4">
          <h3 className="text-lg font-medium text-white mb-3">Account Details</h3>

          <div className="space-y-3 text-sm">
            {user.sub && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-white/60" />
                <span className="text-white/80">User ID:</span>
                <span className="text-white">{user.sub}</span>
              </div>
            )}

            {user.given_name && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-white/60" />
                <span className="text-white/80">First Name:</span>
                <span className="text-white">{user.given_name}</span>
              </div>
            )}

            {user.family_name && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-white/60" />
                <span className="text-white/80">Last Name:</span>
                <span className="text-white">{user.family_name}</span>
              </div>
            )}

            {user.nickname && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-white/60" />
                <span className="text-white/80">Nickname:</span>
                <span className="text-white">{user.nickname}</span>
              </div>
            )}

            {user.org_id && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-white/60" />
                <span className="text-white/80">Organization ID:</span>
                <span className="text-white">{user.org_id}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
