import { FederatedConnectionInterrupt } from "@auth0/ai/interrupts";
import type { Interrupt } from "@langchain/langgraph-sdk";

import { EnsureAPIAccess } from "@/components/auth0-ai/FederatedConnections";

interface FederatedConnectionInterruptHandlerProps {
  interrupt: Interrupt | undefined | null;
  onFinish: () => void;
  auth?: {
    authorizePath?: string;
    returnTo?: string;
  };
}

export function FederatedConnectionInterruptHandler({
  interrupt,
  onFinish,
  auth,
}: FederatedConnectionInterruptHandlerProps) {
  if (
    !interrupt ||
    !FederatedConnectionInterrupt.isInterrupt(interrupt.value)
  ) {
    return null;
  }

  return (
    <div key={interrupt.ns?.join("")} className="whitespace-pre-wrap">
      <EnsureAPIAccess
        mode="popup"
        interrupt={interrupt.value}
        onFinish={onFinish}
        auth={auth}
        connectWidget={{
          title: "Authorization Required.",
          description: interrupt.value.message,
          action: { label: "Authorize" },
        }}
      />
    </div>
  );
}
