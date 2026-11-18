import type { ReactNode } from "react";
import { DorvellFooter } from "./DorvellFooter";
import { DorvellHeader } from "./DorvellHeader";
import { FilmViewerProvider } from "./film/FilmViewer";

type DorvellShellProps = { children: ReactNode };

export function DorvellShell({ children }: DorvellShellProps) {
  return (
    <FilmViewerProvider>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <DorvellHeader />
      <main id="main" tabIndex={-1} className="focus:outline-none">
        {children}
      </main>
      <DorvellFooter />
    </FilmViewerProvider>
  );
}
