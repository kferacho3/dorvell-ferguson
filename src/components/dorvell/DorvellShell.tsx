import { ApertureLoader } from "./ApertureLoader";
import { DorvellFooter } from "./DorvellFooter";
import { DorvellHeader } from "./DorvellHeader";

export function DorvellShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <ApertureLoader />
      <DorvellHeader />
      <div id="main">{children}</div>
      <DorvellFooter />
    </>
  );
}
