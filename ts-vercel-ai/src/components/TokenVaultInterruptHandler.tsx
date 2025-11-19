import { useId } from 'react';
import { TokenVaultInterrupt } from '@auth0/ai/interrupts';
import type { Auth0InterruptionUI } from '@auth0/ai-vercel';

import { TokenVaultConsentPopup } from '@/components/auth0-ai/TokenVault/popup';

type PossibleInterrupt = Auth0InterruptionUI | Record<string, unknown>;

interface TokenVaultInterruptHandlerProps {
  interrupt: PossibleInterrupt | undefined | null;
  onFinish?: () => void;
}

export function TokenVaultInterruptHandler({ interrupt, onFinish }: TokenVaultInterruptHandlerProps) {
  const id = useId();
  if (!interrupt || !TokenVaultInterrupt.isInterrupt(interrupt)) {
    return null;
  }

  return (
    <div key={id} className="whitespace-pre-wrap">
      <TokenVaultConsentPopup
        interrupt={interrupt}
        connectWidget={{
          title: 'Authorization Required.',
          description: interrupt.message,
          action: { label: 'Authorize' },
        }}
        onFinish={onFinish}
      />
    </div>
  );
}
