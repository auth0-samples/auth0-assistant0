import { BrowserView, MobileView } from "react-device-detect";

import type { TokenVaultAuthProps } from "./TokenVaultAuthProps";
import { TokenVaultConsentPopup } from "./popup";
import { TokenVaultConsentRedirect } from "./redirect";

export function TokenVaultConsent(props: TokenVaultAuthProps) {
  const { mode } = props;

  switch (mode) {
    case "popup":
      return <TokenVaultConsentPopup {...props} />;
    case "redirect":
      return <TokenVaultConsentRedirect {...props} />;
    case "auto":
    default:
      return (
        <>
          <BrowserView>
            <TokenVaultConsentPopup {...props} />
          </BrowserView>
          <MobileView>
            <TokenVaultConsentRedirect {...props} />
          </MobileView>
        </>
      );
  }
}
