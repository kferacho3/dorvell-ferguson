"use client";

import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { ElasticButton } from "./ElasticButton";
import { FocusTrailCanvas } from "./FocusTrailCanvas";
import { InquiryTypeSelector } from "./InquiryTypeSelector";
import { DEFAULT_INQUIRY_ID, getInquiryType } from "./inquiryTypes";

type ContactFormProps = {
  email: string;
};

/**
 * Compact inquiry form. There is no contact API in this project, so submitting
 * builds a prepared email (mailto) — the status copy is explicit that nothing
 * sends silently. Real labels, native validation, aria-live status, and a
 * decorative focus trail scoped to the card.
 */
export function ContactForm({ email }: ContactFormProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const copyResetRef = useRef<number | null>(null);
  const [inquiryId, setInquiryId] = useState<string>(DEFAULT_INQUIRY_ID);
  const [draftHref, setDraftHref] = useState("");
  const [copied, setCopied] = useState(false);

  const activeType = getInquiryType(inquiryId);

  useEffect(() => {
    return () => {
      if (copyResetRef.current !== null) window.clearTimeout(copyResetRef.current);
    };
  }, []);

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
      `Preferred date / timeline: ${field("timeline") || "Flexible / TBD"}`,
      `Location: ${field("location") || "TBD"}`,
      `Budget range: ${field("budget") || "Not provided"}`,
      "",
      "Details:",
      field("message"),
    ].join("\n");

    const href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setDraftHref(href);
    window.location.href = href;
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      if (copyResetRef.current !== null) window.clearTimeout(copyResetRef.current);
      copyResetRef.current = window.setTimeout(() => setCopied(false), 2400);
    } catch {
      // Clipboard blocked — the address is shown in the Direct lines strip below.
      setCopied(false);
    }
  };

  return (
    <section className="contact-form-section" id="contact-form" aria-labelledby="contact-form-title">
      <form className="contact-form" onSubmit={buildDraft}>
        <div
          className="contact-form__card"
          ref={cardRef}
          style={{ "--form-accent": activeType.accent } as CSSProperties}
        >
          <FocusTrailCanvas containerRef={cardRef} />

          <div className="contact-form__head">
            <p className="eyebrow" id="contact-form-title">
              The brief
            </p>
            <h2>Send the details.</h2>
            <p className="contact-form__sub">
              Submitting opens your email app with a prepared message — nothing sends silently.
            </p>
          </div>

          <InquiryTypeSelector value={inquiryId} onChange={setInquiryId} />

          <p className="contact-form__helper" aria-live="polite">
            {activeType.helper}
          </p>

          <div className="contact-form__grid">
            <label className="contact-field">
              <span className="contact-field__label">Name</span>
              <input name="name" autoComplete="name" required />
            </label>
            <label className="contact-field">
              <span className="contact-field__label">Email</span>
              <input name="email" type="email" inputMode="email" autoComplete="email" required />
            </label>
            <label className="contact-field">
              <span className="contact-field__label">
                Phone or Instagram <em>optional</em>
              </span>
              <input name="contact" autoComplete="tel" />
            </label>
            <label className="contact-field">
              <span className="contact-field__label">
                Preferred date / timeline <em>optional</em>
              </span>
              <input name="timeline" placeholder="e.g. mid-August, flexible" />
            </label>
            <label className="contact-field">
              <span className="contact-field__label">
                Location <em>optional</em>
              </span>
              <input name="location" autoComplete="off" />
            </label>
            <label className="contact-field">
              <span className="contact-field__label">
                Budget range <em>optional</em>
              </span>
              <input name="budget" placeholder="Helps me scope the shoot" />
            </label>
            <label className="contact-field contact-field--full">
              <span className="contact-field__label">Message / project details</span>
              <textarea name="message" rows={4} required />
            </label>
          </div>

          <div className="contact-form__footer">
            <ElasticButton type="submit">Open prepared email</ElasticButton>
            <button type="button" className="contact-form__copy" onClick={copyEmail}>
              {copied ? "Copied ✓" : "Copy email"}
            </button>
          </div>

          <p className="contact-form__status" role="status" aria-live="polite">
            {draftHref ? (
              <>
                <span>Draft ready in your mail app. Didn&rsquo;t open?</span>
                <a href={draftHref}>Open prepared email</a>
              </>
            ) : null}
          </p>
        </div>
      </form>
    </section>
  );
}
