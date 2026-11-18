import Link from "next/link";
import {
  galleryLaneDefinitions,
  type GalleryLaneKey,
} from "@/lib/gallery-lanes";
import { galleryDisclosureSummary } from "./GallerySelect";

export function PhotographyCollections({
  current,
}: {
  current?: GalleryLaneKey;
}) {
  const links = [
    ...(current ? [{ label: "All photography", href: "/work" }] : []),
    ...galleryLaneDefinitions.filter(
      (collection) => collection.key !== current,
    ),
  ];

  return (
    <details className="group min-w-0">
      <summary className={galleryDisclosureSummary}>
        Collections
        <span aria-hidden="true" className="group-open:rotate-180">
          ⌄
        </span>
      </summary>
      <nav className="mt-2" aria-label="Photography collections">
        <ul className="divide-y divide-[var(--df-line)]">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="flex min-h-11 items-center text-sm text-[var(--df-text-soft)] hover:text-[var(--df-text)] hover:underline"
                prefetch={false}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </details>
  );
}
