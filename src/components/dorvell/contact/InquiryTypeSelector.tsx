"use client";

import type { CSSProperties } from "react";
import { INQUIRY_TYPES } from "./inquiryTypes";

type InquiryTypeSelectorProps = {
  value: string;
  onChange: (id: string) => void;
};

/**
 * Premium segmented control built on native radio inputs, so it keeps full
 * keyboard support (arrow keys move between options, space selects) and screen
 * reader semantics for free. Pills carry a per-category accent and an elastic
 * press via CSS. On mobile the grid collapses to a swipeable chip row.
 */
export function InquiryTypeSelector({ value, onChange }: InquiryTypeSelectorProps) {
  return (
    <fieldset className="contact-selector">
      <legend className="contact-selector__legend">
        <span>What is this about?</span>
        <em>Pick the closest fit — it tailors the brief.</em>
      </legend>
      <div className="contact-selector__grid" role="presentation">
        {INQUIRY_TYPES.map((type) => {
          const selected = value === type.id;
          return (
            <label
              key={type.id}
              className="contact-selector__pill"
              data-selected={selected ? "true" : undefined}
              style={{ "--pill-accent": type.accent } as CSSProperties}
            >
              <input
                type="radio"
                name="inquiryType"
                value={type.label}
                checked={selected}
                onChange={() => onChange(type.id)}
              />
              <span className="contact-selector__dot" aria-hidden="true" />
              <span className="contact-selector__label">{type.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
