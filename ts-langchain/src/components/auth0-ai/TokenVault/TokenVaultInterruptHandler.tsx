import { TokenVaultInterrupt } from '@auth0/ai/interrupts';
import type { Interrupt } from '@langchain/langgraph-sdk';

import { TokenVaultConsent } from '@/components/auth0-ai/TokenVault';

interface TokenVaultInterruptHandlerProps {
  interrupt: Interrupt | undefined | null;
  onFinish: () => void;
}

export function TokenVaultInterruptHandler({ interrupt, onFinish }: TokenVaultInterruptHandlerProps) {
  if (!interrupt || !TokenVaultInterrupt.isInterrupt(interrupt.value)) {
    return null;
  }

  return (
    <div key={interrupt.ns?.join('')} className="whitespace-pre-wrap">
      <TokenVaultConsent
        mode="popup"
        interrupt={interrupt.value}
        onFinish={onFinish}
        connectWidget={{
          title: 'Authorization Required.',
          description: interrupt.value.message,
          action: { label: 'Authorize' },
        }}
      />
    </div>
  );
}
