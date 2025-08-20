import { BrowserView, MobileView } from "react-device-detect";

import type { FederatedConnectionAuthProps } from "./FederatedConnectionAuthProps";
import { EnsureAPIAccessPopup } from "./popup";
import { EnsureAPIAccessRedirect } from "./redirect";

export function EnsureAPIAccess(props: FederatedConnectionAuthProps) {
  const { mode } = props;

  switch (mode) {
    case "popup":
      return <EnsureAPIAccessPopup {...props} />;
    case "redirect":
      return <EnsureAPIAccessRedirect {...props} />;
    case "auto":
    default:
      return (
        <>
          <BrowserView>
            <EnsureAPIAccessPopup {...props} />
          </BrowserView>
          <MobileView>
            <EnsureAPIAccessRedirect {...props} />
          </MobileView>
        </>
      );
  }
}
