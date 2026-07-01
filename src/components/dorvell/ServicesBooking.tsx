import Image from "next/image";
import type { CSSProperties } from "react";
import type { DorvellCategory, DorvellImage } from "@/content/dorvell.schema";
import { buildGalleryLanes } from "@/lib/gallery-lanes";
import { blurImageProps, imageAlt } from "@/lib/images";

type Service = {
  title: string;
  bestFor: string;
  deliverables: string;
  category: DorvellCategory;
};

export function ServicesBooking({
  services,
  email,
  images = [],
  compact = false,
}: {
  services: Service[];
  email: string;
  images?: DorvellImage[];
  compact?: boolean;
}) {
  const lanes = buildGalleryLanes(images);
  const routerFrames = lanes
    .flatMap((lane) =>
      lane.images.slice(0, 2).map((image) => ({
        image,
        lane,
      })),
    )
    .slice(0, 8);

  return (
    <section
      className={compact ? "booking-section is-compact" : "booking-section"}
      aria-labelledby="booking-title"
      data-studio-section="booking"
    >
      <div className="booking-intro">
        <div>
          <p className="eyebrow">Booking</p>
          <h2 id="booking-title">Bring the concept. Leave with images that know where they are going.</h2>
          <p>
            Portraits, fashion/editorial, concerts, athletics, social content, creative direction, and modeling availability.
          </p>
        </div>
        <div className="booking-intro__tags" aria-label="Booking strengths">
          <span>Directed shoots</span>
          <span>Live coverage</span>
          <span>Social-ready edits</span>
        </div>
      </div>
      <div className="booking-desk">
        {lanes.length > 0 ? (
          <div className="booking-router" aria-label="Booking route board">
            <div className="booking-router__copy">
              <p className="eyebrow">Brief Router</p>
              <h3>Pick the lane. Send the pulse.</h3>
              <p>
                Every inquiry opens with a useful subject line, because the first frame should not have to do
                administrative cardio.
              </p>
              <a
                className="button-secondary"
                href={`mailto:${email}?subject=${encodeURIComponent("Dorvell Ferguson Jr. booking inquiry")}`}
              >
                Send the brief
              </a>
            </div>
            <div className="booking-router__routes">
              {lanes.map((lane, index) => {
                const preview = lane.images[(index + 1) % Math.max(lane.images.length, 1)];
                return (
                  <a
                    key={lane.key}
                    href={`mailto:${email}?subject=${encodeURIComponent(`${lane.label} booking inquiry`)}`}
                    style={{ "--lane-accent": lane.accent } as CSSProperties}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    {preview ? (
                      <Image
                        src={preview.localOptimized.sm}
                        alt=""
                        width={preview.width}
                        height={preview.height}
                      />
                    ) : null}
                    <strong>{lane.deckLabel}</strong>
                    <em>{lane.label}</em>
                  </a>
                );
              })}
            </div>
            {routerFrames.length > 0 ? (
              <div className="booking-router__reel" aria-hidden="true">
                {routerFrames.concat(routerFrames.slice(0, 4)).map(({ image, lane }, index) => (
                  <span key={`${image.id}-${index}`} style={{ "--lane-accent": lane.accent } as CSSProperties}>
                    <Image src={image.localOptimized.sm} alt="" width={image.width} height={image.height} />
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
        {lanes.length > 0 ? (
          <div className="booking-lanes" aria-label="Portfolio booking lanes">
            {lanes.map((lane, index) => {
              const preview = lane.images[index % Math.max(lane.images.length, 1)];
              return (
                <a
                  key={lane.key}
                  className="booking-lane"
                  href={`mailto:${email}?subject=${encodeURIComponent(`${lane.label} booking inquiry`)}`}
                  style={{ "--lane-accent": lane.accent } as CSSProperties}
                >
                  <span className="booking-lane__eyebrow">{lane.eyebrow}</span>
                  <div className="booking-lane__image">
                    {preview ? (
                      <Image
                        src={preview.localOptimized.md}
                        alt={imageAlt(preview)}
                        width={preview.width}
                        height={preview.height}
                        {...blurImageProps(preview)}
                      />
                    ) : null}
                  </div>
                  <strong>{lane.label}</strong>
                  <p>{lane.description}</p>
                  <em>{lane.deckLabel}</em>
                </a>
              );
            })}
          </div>
        ) : null}
        <div className="service-grid">
          {services.map((service) => (
            <article key={service.title} className="service-card">
              <span>{service.category}</span>
              <h3>{service.title}</h3>
              <p>{service.bestFor}</p>
              <small>{service.deliverables}</small>
              <a href={`mailto:${email}?subject=${encodeURIComponent(`${service.title} inquiry`)}`}>Inquire</a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
