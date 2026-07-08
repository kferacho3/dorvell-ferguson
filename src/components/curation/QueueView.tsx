"use client";

import Image from "next/image";
import type { CurationPhoto, PhotoDecision } from "@/lib/curation/types";

type QueueViewProps = {
  photos: CurationPhoto[];
  decisions: Record<string, PhotoDecision>;
  onOpenFocus: (id: string) => void;
};

type QueueGroup = {
  key: string;
  title: string;
  hint: string;
  tone: "warn" | "info" | "dest" | "scrap";
  items: CurationPhoto[];
};

function QueueThumb({ photo, onOpenFocus }: { photo: CurationPhoto; onOpenFocus: (id: string) => void }) {
  return (
    <li>
      <button
        type="button"
        className="studio-queue__thumb"
        onClick={() => onOpenFocus(photo.photo_id)}
        aria-label={`Open ${photo.filename} in focus review`}
        title={photo.filename}
      >
        {photo.previewDisconnected ? (
          <span className="studio-queue__thumb-missing" aria-hidden="true">
            ⟳
          </span>
        ) : photo.source === "site" ? (
          <Image
            src={photo.thumb}
            alt=""
            width={Math.max(photo.width, 1)}
            height={Math.max(photo.height, 1)}
            sizes="96px"
            unoptimized
            loading="lazy"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo.thumb} alt="" loading="lazy" />
        )}
      </button>
    </li>
  );
}

export function QueueView({ photos, decisions, onOpenFocus }: QueueViewProps) {
  const groups: QueueGroup[] = [
    {
      key: "needs-category",
      title: "Needs a primary category",
      hint: "These are KEPT but block finalization until each has one primary category.",
      tone: "warn",
      items: photos.filter((p) => {
        const d = decisions[p.photo_id];
        return d?.status === "kept" && !d.category_primary;
      }),
    },
    {
      key: "unreviewed",
      title: "Unreviewed",
      hint: "Still waiting on a KEEP or SCRAP decision.",
      tone: "info",
      items: photos.filter((p) => {
        const d = decisions[p.photo_id];
        return !d || d.status === "unknown";
      }),
    },
    {
      key: "modeling",
      title: "Modeling queue",
      hint: "Kept photos headed to the Modeling page.",
      tone: "dest",
      items: photos.filter((p) => decisions[p.photo_id]?.destinations.modeling),
    },
    {
      key: "projects",
      title: "Projects queue",
      hint: "Kept photos headed to the Projects page.",
      tone: "dest",
      items: photos.filter((p) => decisions[p.photo_id]?.destinations.projects),
    },
    {
      key: "portfolio",
      title: "Portfolio queue",
      hint: "Kept photos headed to the public Portfolio.",
      tone: "dest",
      items: photos.filter((p) => decisions[p.photo_id]?.destinations.portfolio),
    },
    {
      key: "scrapped",
      title: "Scrapped",
      hint: "Never shown publicly. Reopen any photo to change its decision.",
      tone: "scrap",
      items: photos.filter((p) => decisions[p.photo_id]?.status === "scrapped"),
    },
  ];

  return (
    <div className="studio-queue">
      {groups.map((group) => (
        <section key={group.key} className={`studio-queue__group studio-queue__group--${group.tone}`}>
          <header>
            <h3>
              {group.title} <span className="studio-queue__count">{group.items.length.toLocaleString()}</span>
            </h3>
            <p>{group.hint}</p>
          </header>
          {group.items.length === 0 ? (
            <p className="studio-queue__empty">Nothing here.</p>
          ) : (
            <ul className="studio-queue__strip">
              {group.items.slice(0, 60).map((photo) => (
                <QueueThumb key={photo.photo_id} photo={photo} onOpenFocus={onOpenFocus} />
              ))}
              {group.items.length > 60 ? (
                <li className="studio-queue__more">+{(group.items.length - 60).toLocaleString()} more — use filters in Grid review</li>
              ) : null}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
