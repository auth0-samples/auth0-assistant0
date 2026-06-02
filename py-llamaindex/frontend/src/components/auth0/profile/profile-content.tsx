import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

import UserInfoCard from './user-info-card';
import ConnectedAccountsCard from './connected-accounts-card';

interface KeyValueMap {
  [key: string]: any;
}

export default function ProfileContent({ user }: { user: KeyValueMap }) {
  const queryClient = useQueryClient();

  const { data: connectedAccounts = [], isLoading } = useQuery({
    queryKey: ['connected-accounts'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/user/connected-accounts');
      return data.accounts || [];
    },
  });

  return (
    <div className="grid grid-cols-2 lg:grid-cols-2 gap-6">
      {/* User Info Card */}
      <div className="lg:col-span-1">
        <UserInfoCard user={user} />
      </div>

      {/* Linked Accounts Card */}
      <div className="lg:col-span-1">
        <ConnectedAccountsCard
          connectedAccounts={connectedAccounts}
          loading={isLoading}
          onAccountDeleted={() => queryClient.invalidateQueries({ queryKey: ['connected-accounts'] })}
        />
      </div>
    </div>
  );
}
