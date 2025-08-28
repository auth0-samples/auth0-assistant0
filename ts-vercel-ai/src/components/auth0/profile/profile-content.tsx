'use client';

import { useState, useEffect } from 'react';

import UserInfoCard from './user-info-card';
import LinkedAccountsCard, { LinkedIdentity } from './linked-accounts-card';

interface KeyValueMap {
  [key: string]: any;
}

export default function ProfileContent({ user, idTokenHint }: { user: KeyValueMap; idTokenHint: string }) {
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedIdentity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLinkedAccounts();
  }, []);

  const fetchLinkedAccounts = async () => {
    try {
      const response = await fetch('/api/profile/linked-accounts');
      if (response.ok) {
        const data = await response.json();
        setLinkedAccounts(data.identities || []);
      } else {
        console.error('Failed to fetch linked accounts');
      }
    } catch (error) {
      console.error('Error fetching linked accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkAccount = async (provider: string, userId: string) => {
    try {
      const response = await fetch('/api/profile/unlink-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider, userId }),
      });

      if (response.ok) {
        await fetchLinkedAccounts(); // Refresh the list
      } else {
        console.error('Failed to unlink account');
      }
    } catch (error) {
      console.error('Error unlinking account:', error);
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
        <LinkedAccountsCard
          linkedAccounts={linkedAccounts}
          loading={loading}
          idTokenHint={idTokenHint}
          onUnlinkAccount={handleUnlinkAccount}
        />
      </div>
    </div>
  );
}
