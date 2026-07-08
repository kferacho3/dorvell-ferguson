import { Fragment } from "react";
import type { CSSProperties } from "react";
import { pointOfView } from "@/content/about.data";

/**
 * Section 2 — Point of View. The documentary word-by-word read-along: the
 * headline splits into words that rise on entrance (data-reveal-group → the
 * container stays put, words animate), and the body paragraphs resolve
 * blur-to-sharp in a narrow reading column. Split is deterministic (index
 * based) so SSR and client markup match. Server component.
 */
export function AboutPointOfView() {
  const words = pointOfView.headline.split(" ");

  return (
    <section className="about-section about-pov">
      <div className="about-pov__head">
        <span className="about-pov__counter">.{pointOfView.counter}</span>
        <h2 className="about-pov__headline" data-reveal-group>
          {words.map((word, index) => (
            <Fragment key={`${word}-${index}`}>
              <span className="about-word" style={{ "--wi": index } as CSSProperties}>
                {word}
              </span>
              {index < words.length - 1 ? " " : ""}
            </Fragment>
          ))}
        </h2>
        <p className="about-eyebrow" style={{ marginTop: "18px" }}>
          {pointOfView.kicker}
        </p>
      </div>

      <div className="about-pov__body" data-reveal-group>
        {pointOfView.paragraphs.map((paragraph, index) => (
          <p key={index} style={{ "--reveal-i": index } as CSSProperties}>
            {paragraph}
          </p>
        ))}
        <p className="about-pov__attr">{pointOfView.attribution}</p>
      </div>
    </section>
  );
}
