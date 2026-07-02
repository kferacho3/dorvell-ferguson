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

const categoryAccents: Partial<Record<DorvellCategory, string>> = {
  Portraits: "#f0b35a",
  Fashion: "#35e0bb",
  Music: "#f04d5e",
  Athletics: "#48c7ff",
  "Behind The Scenes": "#f0b35a",
  Runway: "#35e0bb",
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
      lane.images.slice(0, 3).map((image) => ({
        image,
        lane,
      })),
    )
    .slice(0, 10);
  const fallbackLane = lanes[0];
  const serviceCards = services.map((service, index) => ({
    service,
    image:
      images.find((image) => image.category === service.category) ??
      fallbackLane?.images[index % Math.max(fallbackLane.images.length, 1)] ??
      images[index % Math.max(images.length, 1)],
  }));

  return (
    <section
      className={compact ? "booking-section is-compact" : "booking-section"}
      aria-labelledby="booking-title"
      data-studio-section="booking"
    >
      <div className="booking-intro">
        <div>
          <p className="eyebrow">Booking</p>
          <h2 id="booking-title">Choose the lane. Leave with a polished set.</h2>
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
          <div className="booking-router" aria-label="Booking inquiry selector">
            <div className="booking-router__copy">
              <p className="eyebrow">Inquiry lanes</p>
              <h3>Start with the image world.</h3>
              <p>
                Start with the kind of shoot you need. The email opens with the right subject line so the conversation
                can get straight to dates, location, usage, and direction.
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
              <div className="booking-router__proof" aria-label="Recent portfolio samples">
                {routerFrames.map(({ image, lane }, index) => (
                  <span key={`${image.id}-${index}`} style={{ "--lane-accent": lane.accent } as CSSProperties}>
                    <Image
                      src={image.localOptimized.sm}
                      alt={imageAlt(image)}
                      width={image.width}
                      height={image.height}
                      {...blurImageProps(image)}
                    />
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="service-grid" aria-label="Booking options">
          {serviceCards.map(({ service, image }) => (
            <article
              key={service.title}
              className="service-card"
              style={{ "--lane-accent": categoryAccents[service.category] ?? "#35e0bb" } as CSSProperties}
            >
              {image ? (
                <span className="service-card__thumb">
                  <Image
                    src={image.localOptimized.sm}
                    alt=""
                    width={image.width}
                    height={image.height}
                    unoptimized
                    {...blurImageProps(image)}
                  />
                </span>
              ) : null}
              <span className="service-card__category">{service.category}</span>
              <h3>{service.title}</h3>
              <p>{service.bestFor}</p>
              <small>{service.deliverables}</small>
              <a className="service-card__link" href={`mailto:${email}?subject=${encodeURIComponent(`${service.title} inquiry`)}`}>
                Inquire
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
