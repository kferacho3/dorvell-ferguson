import Image from "next/image";
import type { DorvellImage } from "@/content/dorvell.schema";
import { blurImageProps, imageAlt } from "@/lib/images";
import type { RunwayPressEntry } from "@/content/dorvell.manual";

export function RunwayTimeline({
  images,
  entries,
  expanded = false,
}: {
  images: DorvellImage[];
  entries: RunwayPressEntry[];
  expanded?: boolean;
}) {
  const runwayImages = images
    .filter((image) => ["Modeling", "Fashion", "Portraits"].includes(image.category))
    .slice(0, expanded ? 9 : 5);
  const verifiedEntries = entries.filter((entry) => entry.proof !== "needsVerification");

  return (
    <section
      className={expanded ? "runway-section is-expanded" : "runway-section"}
      aria-labelledby="runway-title"
      data-studio-section="runway"
    >
      <div className="section-heading">
        <p className="eyebrow">Runway / Modeling</p>
        <h2 id="runway-title">Camera-aware presence, not a separate personality.</h2>
        <p>Movement, fit, light, and angle are treated as one job.</p>
      </div>

      <div className="runway-catwalk">
        <div className="runway-rail" aria-label="Runway visual rail">
          {runwayImages.map((image, index) => (
            <figure key={image.id} className="runway-frame">
              <Image
                src={image.localOptimized.md}
                alt={imageAlt(image)}
                width={image.width}
                height={image.height}
                {...blurImageProps(image)}
              />
              <figcaption>{String(index + 1).padStart(2, "0")}</figcaption>
            </figure>
          ))}
        </div>
        {verifiedEntries.length > 0 ? (
          <ol className="timeline-list">
            {verifiedEntries.map((entry) => (
              <li key={entry.title}>
                <span>{entry.label}</span>
                <strong>{entry.title}</strong>
                {entry.year ? <em>{entry.year}</em> : null}
              </li>
            ))}
          </ol>
        ) : (
          <ul className="timeline-list is-process">
            <li>
              <span>Movement</span>
              <strong>Pose language shaped by a photographer&apos;s eye</strong>
              <em>camera-aware from both sides</em>
            </li>
            <li>
              <span>Direction</span>
              <strong>Editorial tests, fit reads, and clean on-set rhythm</strong>
              <em>built for fashion-facing work</em>
            </li>
            <li>
              <span>Availability</span>
              <strong>Runway, campaign, and creative direction inquiries</strong>
              <em>Tampa-based, travel by inquiry</em>
            </li>
          </ul>
        )}
      </div>
    </section>
  );
}
