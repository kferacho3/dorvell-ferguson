import { ApertureLoader } from "./ApertureLoader";
import { DorvellFooter } from "./DorvellFooter";
import { DorvellHeader } from "./DorvellHeader";
import { FilmViewerProvider } from "./film/FilmViewer";

export function DorvellShell({ children }: { children: React.ReactNode }) {
  return (
    // The film viewer lives at the shell so the landing hero, the Creative Hub
    // and any film route all open the same one — no page needs its own copy.
    <FilmViewerProvider>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <ApertureLoader />
      <DorvellHeader />
      <main id="main">{children}</main>
      <DorvellFooter />
    </FilmViewerProvider>
  );
}
