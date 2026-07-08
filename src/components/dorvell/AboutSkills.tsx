import type { CSSProperties } from "react";
import { skillGroups, skillsMicrocopy } from "@/content/about.data";

/**
 * Section 5 — Skills constellation. Four grouped clusters (not a flat tag soup),
 * each a titled panel of chips that rest desaturated and restore color on hover
 * (the codrops grid "focus restores color" idea, demoted to CSS — zero WebGL).
 * Panels stagger in on scroll. Server component.
 */
export function AboutSkills() {
  return (
    <section className="about-section about-skills">
      <div className="about-skills__head" data-reveal>
        <p className="about-eyebrow">Creative operating system</p>
        <p className="about-skills__micro">{skillsMicrocopy}</p>
      </div>

      <div className="about-skills__grid">
        {skillGroups.map((group, index) => (
          <article
            className="about-skill"
            data-reveal
            key={group.label}
            style={{ "--reveal-i": index } as CSSProperties}
          >
            <h3 className="about-skill__label">{group.label}</h3>
            <p className="about-skill__desc">{group.description}</p>
            <ul className="about-skill__chips">
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
