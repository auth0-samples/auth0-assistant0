'use client';
import type { ReactNode } from 'react';

/**
 * Defines the mode the TokenVaultConsent component will use to prompt the user to connect a third-party account and
 * authorize the API access.
 * - `redirect` will redirect the user to the provider's authorization page.
 * - `popup` will open a popup window to prompt the user to authorize the API access.
 * - `auto` will automatically choose the best mode based on the user's device and browser.
 */
export type AuthComponentMode = 'redirect' | 'popup' | 'auto';

export type TokenVaultAuthProps = {
  interrupt: {
    connection: string;
    requiredScopes: string[];
    authorizationParams?: Record<string, string>;
    resume?: () => void;
  };
  auth?: {
    connectPath?: string;
    returnTo?: string;
  };
  onFinish?: () => void;
  connectWidget: {
    icon?: ReactNode;
    title: string;
    description: string;
    action?: { label: string };
    containerClassName?: string;
  };
  mode?: AuthComponentMode;
};
