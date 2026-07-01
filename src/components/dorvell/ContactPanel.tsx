"use client";

import Image from "next/image";
import { useState, type CSSProperties, type FormEvent } from "react";
import type { DorvellImage } from "@/content/dorvell.schema";
import type { DorvellManual } from "@/content/dorvell.manual";
import { buildGalleryLanes } from "@/lib/gallery-lanes";
import { blurImageProps, imageAlt } from "@/lib/images";

type Profile = DorvellManual["profile"];

const inquiryTypes = [
  "Portrait / Fashion Shoot",
  "Event / Concert Coverage",
  "Athletics Coverage",
  "Modeling / Runway",
  "Creative Direction",
  "Collaboration",
];

export function ContactPanel({ profile, images = [] }: { profile: Profile; images?: DorvellImage[] }) {
  const lanes = buildGalleryLanes(images);
  const [draftStatus, setDraftStatus] = useState("");
  const [draftHref, setDraftHref] = useState("");

  const createEmailDraft = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const field = (name: string) => String(data.get(name) ?? "").trim();
    const type = field("type") || "Booking";
    const subject = `${type} inquiry for Dorvell`;
    const body = [
      `Name: ${field("name")}`,
      `Email: ${field("email")}`,
      `Phone: ${field("phone") || "Not provided"}`,
      `Inquiry type: ${type}`,
      `Desired date: ${field("desiredDate") || "Flexible / TBD"}`,
      `Location: ${field("location") || "TBD"}`,
      `Budget range: ${field("budget") || "Not provided"}`,
      `Inspiration link: ${field("inspiration") || "Not provided"}`,
      "",
      "Message:",
      field("message"),
    ].join("\n");

    const href = `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setDraftHref(href);
    window.location.href = href;
    setDraftStatus("Email draft prepared. Use the link below if your mail app did not open.");
  };

  return (
    <section className="contact-panel" aria-labelledby="contact-title">
      <div className="contact-copy">
        <p className="eyebrow">Contact</p>
        <h1 id="contact-title">Send the details. Dorvell can meet the moment.</h1>
        <p>
          For shoots, runway/modeling opportunities, creative direction, collaborations, or media coverage, use the direct contact paths below.
        </p>
        <div className="contact-signal-grid" aria-label="Working notes">
          <span>
            <strong>Base</strong>
            Tampa, FL
          </span>
          <span>
            <strong>Range</strong>
            Photo / model / direction
          </span>
          <span>
            <strong>Best brief</strong>
            Date, place, mood, usage
          </span>
        </div>
        <div className="contact-actions">
          <a className="button-primary" href={`mailto:${profile.email}?subject=Booking%20Inquiry%20for%20Dorvell`}>
            {profile.email}
          </a>
          <a className="button-secondary" href={`tel:${profile.phone.replace(/[^0-9+]/g, "")}`}>
            {profile.phone}
          </a>
        </div>
        {lanes.length > 0 ? (
          <div className="contact-lane-strip" aria-label="Gallery lanes">
            {lanes.map((lane) => {
              const preview = lane.images[0];
              return (
                <a
                  key={lane.key}
                  className="contact-lane-chip"
                  href={`/#${lane.slug}`}
                  style={{ "--lane-accent": lane.accent } as CSSProperties}
                >
                  {preview ? (
                    <Image
                      src={preview.localOptimized.sm}
                      alt={imageAlt(preview)}
                      width={preview.width}
                      height={preview.height}
                      {...blurImageProps(preview)}
                    />
                  ) : null}
                  <span>{lane.label}</span>
                </a>
              );
            })}
          </div>
        ) : null}
      </div>
      <form
        className="booking-form"
        onSubmit={createEmailDraft}
      >
        <div className="form-header full">
          <span>Creative brief</span>
          <strong>Give the shoot a shape before the first frame.</strong>
        </div>
        <label>
          <span>Name</span>
          <input name="name" required />
        </label>
        <label>
          <span>Email</span>
          <input name="email" type="email" required />
        </label>
        <label>
          <span>Phone optional</span>
          <input name="phone" type="tel" />
        </label>
        <label>
          <span>Inquiry Type</span>
          <select name="type" defaultValue="Portrait / Fashion Shoot">
            {inquiryTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Desired Date</span>
          <input name="desiredDate" type="date" />
        </label>
        <label>
          <span>Location</span>
          <input name="location" />
        </label>
        <label>
          <span>Budget Range</span>
          <input name="budget" />
        </label>
        <label className="full">
          <span>Message</span>
          <textarea name="message" rows={5} required />
        </label>
        <label className="full">
          <span>Inspiration Link</span>
          <input name="inspiration" type="url" />
        </label>
        <button type="submit">Create email draft</button>
        {draftStatus ? (
          <p className="form-status" role="status">
            <span>{draftStatus}</span>
            {draftHref ? (
              <a href={draftHref}>
                Open prepared email
              </a>
            ) : null}
          </p>
        ) : null}
      </form>
    </section>
  );
}
