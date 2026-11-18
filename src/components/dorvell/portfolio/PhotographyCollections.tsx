import Link from "next/link";
import {
  galleryLaneDefinitions,
  type GalleryLaneKey,
} from "@/lib/gallery-lanes";

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
    <nav
      className="mt-12 border-t border-[var(--df-line)] pt-5 sm:mt-16"
      aria-label="Photography collections"
    >
      <h2 className="text-sm font-semibold">
        {current ? "More photography" : "Photography collections"}
      </h2>
      <ul className="mt-2 flex flex-wrap gap-x-6">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex min-h-11 items-center text-sm text-[var(--df-text-soft)] underline decoration-[var(--df-line-strong)] underline-offset-4 hover:text-[var(--df-text)]"
              prefetch={false}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
