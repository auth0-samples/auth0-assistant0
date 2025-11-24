'use server';

import { auth0 } from '@/lib/auth0';

export interface ConnectedAccount {
  id: string;
  connection: string;
  access_type: string;
  scopes: string[];
  created_at: Date;
  expires_at: Date;
}

export async function fetchConnectedAccounts(): Promise<ConnectedAccount[]> {
  try {
    const { token } = await auth0.getAccessToken({
      audience: `https://${process.env.AUTH0_DOMAIN}/me/`,
      scope: 'read:me:connected_accounts',
    });

    if (!token) {
      console.log('No token retrieved');
      return [];
    }

    const response = await fetch(`https://${process.env.AUTH0_DOMAIN}/me/v1/connected-accounts/accounts`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Connected Accounts Response:', data);
      return data.accounts || [];
    } else {
      console.error('Failed to fetch connected accounts');
      return [];
    }
  } catch (error) {
    console.error('Error fetching connected accounts:', error);
    return [];
  }
}
