"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ElasticButton } from "./ElasticButton";
import { PhotoTrail } from "./PhotoTrail";
import { RippleVideoPanel } from "./RippleVideoPanel";
import { DEFAULT_INQUIRY_ID, INQUIRY_TYPES, getInquiryType } from "./inquiryTypes";
import type { StudioVideo } from "./studioTypes";

type Props = {
  email: string;
  videos: StudioVideo[];
  photos: string[];
};

/**
 * Immersive single-screen contact experience: a huge centered card with a
 * ripple-transitioning creative video on the left and a simple form on the
 * right, floating over an infinite photo trail that reacts to the pointer.
 * No backend — submitting opens a prepared email (mailto), never a fake send.
 */
export function ContactStudio({ email, videos, photos }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [inquiryId, setInquiryId] = useState<string>(DEFAULT_INQUIRY_ID);
  const [draftHref, setDraftHref] = useState("");

  const activeType = getInquiryType(inquiryId);

  const onSelectType = (event: ChangeEvent<HTMLSelectElement>) => {
    const match = INQUIRY_TYPES.find((type) => type.label === event.target.value);
    if (match) setInquiryId(match.id);
  };

  const buildDraft = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const field = (name: string) => String(data.get(name) ?? "").trim();
    const typeLabel = field("inquiryType") || activeType.label;

    const subject = `${typeLabel} — inquiry for Dorvell Ferguson Jr.`;
    const body = [
      `Inquiry type: ${typeLabel}`,
      `Name: ${field("name")}`,
      `Email: ${field("email")}`,
      `Phone / Instagram: ${field("contact") || "Not provided"}`,
      "",
      "Details:",
      field("message"),
    ].join("\n");

    const href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setDraftHref(href);
    window.location.href = href;
  };

  return (
    <section className="contact-studio" aria-labelledby="contact-studio-title">
      <PhotoTrail photos={photos} holeRef={cardRef} />

      <div className="contact-studio__card" ref={cardRef}>
        <div className="contact-studio__media">
          <RippleVideoPanel videos={videos} />
        </div>

        <form className="contact-studio__form" onSubmit={buildDraft}>
          <p className="eyebrow">Contact · Tampa, FL</p>
          <h1 id="contact-studio-title">Let&rsquo;s build the shot.</h1>
          <p className="contact-studio__lead">
            Portraits, concerts, sports, fashion, editorial, and creative collaborations. Send the
            brief and Dorvell will follow up.
          </p>

          <div className="contact-studio__grid">
            <label className="studio-field">
              <span className="studio-field__label">Name</span>
              <input name="name" autoComplete="name" required />
            </label>
            <label className="studio-field">
              <span className="studio-field__label">Email</span>
              <input name="email" type="email" inputMode="email" autoComplete="email" required />
            </label>
            <label className="studio-field">
              <span className="studio-field__label">
                Phone or Instagram <em>optional</em>
              </span>
              <input name="contact" autoComplete="tel" />
            </label>
            <label className="studio-field">
              <span className="studio-field__label">Inquiry type</span>
              <select name="inquiryType" value={activeType.label} onChange={onSelectType}>
                {INQUIRY_TYPES.map((type) => (
                  <option key={type.id} value={type.label}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="studio-field studio-field--full">
              <span className="studio-field__label">Message / project details</span>
              <textarea name="message" rows={3} required aria-describedby="studio-helper" />
            </label>
          </div>

          <p className="contact-studio__helper" id="studio-helper" aria-live="polite">
            {activeType.helper}
          </p>

          <div className="contact-studio__actions">
            <ElasticButton type="submit">Open prepared email</ElasticButton>
            <a className="contact-studio__direct" href={`mailto:${email}`}>
              or email directly
            </a>
          </div>

          <p className="contact-studio__status" role="status" aria-live="polite">
            {draftHref ? (
              <>
                <span>Draft ready in your mail app. Didn&rsquo;t open?</span>{" "}
                <a href={draftHref}>Open prepared email</a>
              </>
            ) : null}
          </p>
        </form>
      </div>
    </section>
  );
}
