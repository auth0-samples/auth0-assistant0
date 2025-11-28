"use client";

import { PromptUserContainer } from "../util/prompt-user-container";
import type { FederatedConnectionAuthProps } from "./FederatedConnectionAuthProps";

export function EnsureAPIAccessRedirect({
  interrupt: { requiredScopes, connection },
  connectWidget: { icon, title, description, action, containerClassName },
  auth: {
    authorizePath = "/auth/login",
    returnTo = window.location.pathname,
  } = {},
}: FederatedConnectionAuthProps) {
  return (
    <PromptUserContainer
      title={title}
      description={description}
      icon={icon}
      containerClassName={containerClassName}
      action={{
        label: action?.label ?? "Connect",
        onClick: () => {
          const search = new URLSearchParams({
            returnTo,
            connection,
            access_type: "offline",
            connection_scope: requiredScopes.join(),
          });

          const url = new URL(authorizePath, window.location.origin);
          url.search = search.toString();

          // Redirect to the authorization page
          window.location.href = url.toString();
        },
      }}
    />
  );
}
