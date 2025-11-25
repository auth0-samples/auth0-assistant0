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

const CONNECTED_ACCOUNTS_AUDIENCE = `https://${process.env.AUTH0_DOMAIN}/me/`;
const CONNECTED_ACCOUNTS_BASE_URL = `https://${process.env.AUTH0_DOMAIN}/me/v1/connected-accounts/accounts`;

/**
 * Get an access token for the connected accounts API
 */
async function getConnectedAccountsToken(scope: string): Promise<string | null> {
  try {
    const { token } = await auth0.getAccessToken({
      audience: CONNECTED_ACCOUNTS_AUDIENCE,
      scope,
    });

    if (!token) {
      console.log('No token retrieved');
      return null;
    }

    return token;
  } catch (error) {
    console.error('Error retrieving access token:', error);
    return null;
  }
}

/**
 * Create headers for API requests
 */
function createApiHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchConnectedAccounts(): Promise<ConnectedAccount[]> {
  try {
    const token = await getConnectedAccountsToken('read:me:connected_accounts');
    if (!token) {
      return [];
    }

    const response = await fetch(CONNECTED_ACCOUNTS_BASE_URL, {
      headers: createApiHeaders(token),
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

export async function deleteConnectedAccount(connectedAccountId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getConnectedAccountsToken('delete:me:connected_accounts');
    if (!token) {
      return { success: false, error: 'No token retrieved' };
    }

    const response = await fetch(`${CONNECTED_ACCOUNTS_BASE_URL}/${connectedAccountId}`, {
      method: 'DELETE',
      headers: createApiHeaders(token),
    });

    if (response.ok) {
      console.log('Connected account deleted successfully');
      return { success: true };
    } else {
      const errorText = await response.text();
      console.error('Failed to delete connected account:', errorText);
      return { success: false, error: errorText || 'Failed to delete connected account' };
    }
  } catch (error) {
    console.error('Error deleting connected account:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
