import Image from "next/image";
import type { CSSProperties } from "react";
import type { DorvellImage } from "@/content/dorvell.schema";
import { aboutRoles } from "@/content/about.data";
import { blurImageProps } from "@/lib/images";

/**
 * Section 3 — Role triptych (Photographer / Photojournalist / Model · Artist).
 * Each card is a dimmed plate + oversized label with one accent word; the plate
 * runs a documentary focus-pull (blur ≤4px, scale ≤1.06) driven by the shared
 * rAF `--focus` var, and sharpens fully on hover/focus. Server component.
 */
export function AboutRoleTriptych({ plates }: { plates: (DorvellImage | undefined)[] }) {
  return (
    <section className="about-block about-roles">
      <div className="about-roles__head">
        <p className="about-eyebrow">Creative disciplines</p>
        <h2 className="about-roles__title">One eye, three disciplines.</h2>
      </div>

      <div className="about-roles__grid">
        {aboutRoles.map((role, index) => {
          const plate = plates[index];
          const head = role.title.slice(0, role.accentFrom);
          const tail = role.title.slice(role.accentFrom);
          return (
            <article
              className="about-role"
              data-reveal
              data-focus
              key={role.key}
              style={{ "--reveal-i": index } as CSSProperties}
              tabIndex={0}
            >
              {plate ? (
                <div className="about-role__plate" aria-hidden="true">
                  <Image
                    src={plate.localOptimized.md}
                    alt=""
                    width={plate.width}
                    height={plate.height}
                    sizes="(max-width: 1080px) 100vw, 33vw"
                    {...blurImageProps(plate)}
                  />
                </div>
              ) : null}

              <h3 className="about-role__title">
                {head}
                <span className="about-role__accent">{tail}</span>
              </h3>
              <p className="about-role__blurb">{role.blurb}</p>

              <ul className="about-role__skills">
                {role.skills.map((skill) => (
                  <li className="about-role__chip" key={skill}>
                    {skill}
                  </li>
                ))}
              </ul>

              <dl className="about-role__meta">
                <div>
                  <dt>Role</dt>
                  <dd>{role.meta.role}</dd>
                </div>
                <div>
                  <dt>Focus</dt>
                  <dd>{role.meta.focus}</dd>
                </div>
                <div>
                  <dt>Deliverable</dt>
                  <dd>{role.meta.deliverable}</dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>
    </section>
  );
}
