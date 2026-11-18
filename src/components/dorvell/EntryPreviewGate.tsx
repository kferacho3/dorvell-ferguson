"use client";

import Image from "next/image";
import {
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const storageKey = "df-entry-gate-seen";

type EntryPreview = {
  label: string;
  src: string;
  blur?: string;
};

type EntryPreviewGateProps = {
  children: ReactNode;
  previews: EntryPreview[];
  totalFrames: number;
};

function shouldSkipEntrance() {
  if (window.location.hash.length > 1) return true;

  try {
    return window.sessionStorage.getItem(storageKey) === "1";
  } catch {
    return false;
  }
}

const stayOnEntrance = () => false;
const subscribeToEntrance = () => () => {};

export function EntryPreviewGate({
  children,
  previews,
  totalFrames,
}: EntryPreviewGateProps) {
  const [entered, setEntered] = useState(false);
  const skipEntrance = useSyncExternalStore(
    subscribeToEntrance,
    shouldSkipEntrance,
    stayOnEntrance,
  );
  const showEntrance = !entered && !skipEntrance;
  const dialogRef = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (dialog?.open && !dialog.matches(":modal") && !shouldSkipEntrance()) {
      // The initial HTML shows the entrance before it can become a modal.
      dialog.close();
      dialog.showModal();
    }

    if (skipEntrance) {
      const targetId = window.location.hash.slice(1);
      document
        .getElementById(targetId)
        ?.scrollIntoView({ behavior: "instant" });
    }
  }, [skipEntrance]);

  function enter() {
    try {
      window.sessionStorage.setItem(storageKey, "1");
    } catch {
      // The current visit can continue without session storage.
    }

    dialogRef.current?.close();
    setEntered(true);
    document.getElementById("main")?.focus({ preventScroll: true });
  }

  return (
    <>
      {showEntrance ? (
        <dialog
          ref={dialogRef}
          open
          aria-modal="true"
          aria-labelledby="entry-title"
          className="peer fixed inset-0 m-0 h-[100dvh] max-h-none w-full max-w-none overflow-y-auto overscroll-contain bg-[var(--df-bg)] text-[var(--df-text)] backdrop:bg-[var(--df-bg)]"
          onCancel={(event) => {
            event.preventDefault();
            enter();
          }}
        >
          <div className="mx-auto flex min-h-full max-w-[100rem] flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] md:px-[4vw] md:pb-9">
            <div className="flex flex-1 flex-col items-start justify-center py-9 md:items-center md:text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.13em] text-[var(--df-text-soft)]">
                Dorvell Ferguson Jr. / Tampa
              </p>
              <h1
                id="entry-title"
                className="text-[clamp(3.5rem,13vw,5.5rem)] font-extrabold uppercase leading-[0.9] tracking-tight [font-family:var(--font-display)] md:text-[clamp(4.75rem,7vw,7rem)]"
              >
                Enter the archive.
              </h1>
              <p className="mt-4 text-sm text-[var(--df-text-soft)]">
                {totalFrames.toLocaleString("en-US")} frames across portraits,
                music, sports, and fashion.
              </p>
              <form
                method="dialog"
                className="mt-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  enter();
                }}
              >
                <button
                  type="submit"
                  className="min-h-11 rounded-full bg-[var(--df-gold)] px-7 text-sm font-bold uppercase text-[var(--df-ink)] hover:bg-[var(--df-paper)]"
                >
                  Enter
                </button>
              </form>
            </div>

            {previews.length > 0 ? (
              <ul
                aria-label="Portfolio preview"
                className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-5"
              >
                {previews.map(({ label, src, blur }, index) => (
                  <li
                    className={index < 2 ? undefined : "hidden md:block"}
                    key={label}
                  >
                    <figure className="relative h-[clamp(5rem,22svh,13.75rem)] overflow-hidden rounded-lg bg-[var(--df-panel-solid)]">
                      <Image
                        alt=""
                        className="object-cover"
                        fill
                        loading={index < 2 ? "eager" : "lazy"}
                        placeholder={blur ? "blur" : "empty"}
                        blurDataURL={blur}
                        src={src}
                        sizes="(min-width: 768px) 25vw, 50vw"
                        unoptimized
                      />
                      <figcaption className="absolute bottom-2 left-2 bg-[var(--df-bg)] px-2 py-1 text-xs font-semibold text-[var(--df-text)]">
                        {label}
                      </figcaption>
                    </figure>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </dialog>
      ) : null}
      <div className="peer-open:hidden">{children}</div>
    </>
  );
}
