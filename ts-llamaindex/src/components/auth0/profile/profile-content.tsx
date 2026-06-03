'use client';

import { useState, useEffect } from 'react';

import UserInfoCard from './user-info-card';
import ConnectedAccountsCard from './connected-accounts-card';
import { ConnectedAccount, fetchConnectedAccounts } from '@/lib/actions/profile';

interface KeyValueMap {
  [key: string]: any;
}

export default function ProfileContent({ user }: { user: KeyValueMap }) {
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConnectedAccounts();
  }, []);

  const loadConnectedAccounts = async () => {
    try {
      const accounts = await fetchConnectedAccounts();
      console.log('Fetched Linked Accounts:', accounts);
      setConnectedAccounts(accounts);
    } catch (error) {
      console.error('Error fetching linked accounts:', error);
    } finally {
      setLoading(false);
    }
  };

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
          loading={loading}
          onAccountDeleted={loadConnectedAccounts}
        />
      </div>
    </div>
  );
}
