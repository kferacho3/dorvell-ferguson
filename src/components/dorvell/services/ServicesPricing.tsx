"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { PRICING, buildBookingMailto, sessionTotal } from "@/lib/services-content";

export interface ServiceCardData {
  title: string;
  bestFor: string;
  deliverables: string;
  category: string;
  accent: string;
  image?: { src: string; alt: string; width: number; height: number; blurDataURL?: string };
}

function PlusMinus({ sign }: { sign: "plus" | "minus" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2.5 8h11" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      {sign === "plus" ? <path d="M8 2.5v11" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" /> : null}
    </svg>
  );
}

export function ServicesPricing({ services, email }: { services: ServiceCardData[]; email: string }) {
  const [hours, setHours] = useState<number>(PRICING.minHours);
  const total = sessionTotal(hours);
  const hourLabel = hours === 1 ? "1 hour" : `${hours} hours`;

  const decrease = () => setHours((value) => Math.max(PRICING.minHours, value - 1));
  const increase = () => setHours((value) => Math.min(PRICING.maxHours, value + 1));

  return (
    <section id="svc-services" className="svc-services" aria-labelledby="svc-services-title">
      <header className="svc-services__head">
        <p className="eyebrow">Booking &amp; rates</p>
        <h2 id="svc-services-title">Pick the lane. Book the frame.</h2>
        <p className="svc-services__lede">
          Every booking starts at <strong>${PRICING.base} for the first hour</strong>, then{" "}
          <strong>+${PRICING.hourlyAddon} for each additional hour</strong>. Directed on set, edited after,
          delivered social-ready.
        </p>
      </header>

      <div className="svc-services__body">
        <div className="svc-rate" aria-labelledby="svc-rate-title">
          <p className="eyebrow">Estimate your session</p>
          <h3 id="svc-rate-title">Session calculator</h3>

          <div className="svc-rate__stepper">
            <button
              type="button"
              className="svc-step-btn"
              onClick={decrease}
              aria-disabled={hours <= PRICING.minHours}
              aria-label="Decrease session length by one hour"
            >
              <PlusMinus sign="minus" />
            </button>
            <div className="svc-rate__readout" aria-live="polite">
              <span className="svc-rate__hours">{hourLabel}</span>
              <span className="svc-rate__hint">
                {hours === PRICING.maxHours ? "Longer? Mention it in the note." : "on set + edit + delivery"}
              </span>
            </div>
            <button
              type="button"
              className="svc-step-btn"
              onClick={increase}
              aria-disabled={hours >= PRICING.maxHours}
              aria-label="Increase session length by one hour"
            >
              <PlusMinus sign="plus" />
            </button>
          </div>

          <p className="svc-rate__total">
            <span className="svc-rate__amount" aria-live="polite">${total}</span>
            <span className="svc-rate__break">
              ${PRICING.base} first hour{hours > 1 ? ` + $${PRICING.hourlyAddon} × ${hours - 1}` : ""}
            </span>
          </p>

          <span className="svc-border-wrap svc-border-wrap--block">
            <a
              className="svc-cta svc-cta--primary svc-cta--full"
              href={buildBookingMailto(email, hours)}
              aria-label={`Book a ${hourLabel} session, estimated $${total}, by email`}
            >
              Book this session
            </a>
          </span>
          <p className="svc-rate__note">Opens your email app with the brief pre-filled.</p>
        </div>

        <ul className="svc-grid" aria-label="Photography &amp; creative services">
          {services.map((service) => (
            <li
              key={service.title}
              className="svc-card"
              style={{ "--lane-accent": service.accent } as CSSProperties}
            >
              {service.image ? (
                <span className="svc-card__thumb">
                  <Image
                    src={service.image.src}
                    alt=""
                    width={service.image.width}
                    height={service.image.height}
                    sizes="(max-width: 720px) 100vw, 360px"
                    placeholder={service.image.blurDataURL ? "blur" : "empty"}
                    blurDataURL={service.image.blurDataURL}
                  />
                </span>
              ) : null}
              <div className="svc-card__body">
                <span className="svc-card__category">{service.category}</span>
                <h3 className="svc-card__title">{service.title}</h3>
                <p className="svc-card__best">{service.bestFor}</p>
                <p className="svc-card__deliverables">{service.deliverables}</p>
                <a
                  className="svc-card__book"
                  href={buildBookingMailto(email, hours, service.title)}
                  aria-label={`Book ${service.title} — email Dorvell`}
                >
                  Book {service.title}
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
