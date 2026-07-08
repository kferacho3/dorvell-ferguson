import Image from "next/image";
import type { CSSProperties } from "react";
import type { DorvellImage } from "@/content/dorvell.schema";
import { skillGroups, skillsMicrocopy } from "@/content/about.data";
import { blurImageProps } from "@/lib/images";

/**
 * Section 5 — Skills constellation. Four clusters grouped by their real source
 * (Freelance / Troy University / Blue Fish). Each panel carries a duotone
 * focus-pull plate behind the content (sharpens on scroll/hover — kills the
 * flat chip wall) and a ghost index numeral; chips cascade in with a back
 * overshoot. Server component; plates are picked server-side.
 */
export function AboutSkills({ plates = [] }: { plates?: (DorvellImage | undefined)[] }) {
  return (
    <section className="about-block about-skills">
      <div className="about-skills__head" data-reveal>
        <p className="about-eyebrow">Creative operating system</p>
        <p className="about-skills__micro">{skillsMicrocopy}</p>
      </div>

      <div className="about-skills__grid">
        {skillGroups.map((group, index) => {
          const plate = plates[index];
          return (
            <article
              className="about-skill"
              data-reveal
              data-focus
              key={group.label}
              style={{ "--reveal-i": index } as CSSProperties}
            >
              {plate ? (
                <div className="about-skill__plate" aria-hidden="true">
                  <Image
                    src={plate.localOptimized.sm}
                    alt=""
                    width={plate.width}
                    height={plate.height}
                    sizes="(max-width: 640px) 92vw, 44vw"
                    {...blurImageProps(plate)}
                  />
                </div>
              ) : null}
              <span className="about-skill__index" aria-hidden="true">
                .{String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="about-skill__label">{group.label}</h3>
              <p className="about-skill__source">{group.source}</p>
              <p className="about-skill__desc">{group.description}</p>
              <ul className="about-skill__chips" data-reveal-group>
                {group.items.map((item, ci) => (
                  <li
                    key={item}
                    style={{ "--ci": ci, "--cr": `${((ci * 37) % 9) - 4}deg`, "--cx": ci % 2 === 0 ? "-10px" : "10px" } as CSSProperties}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}
