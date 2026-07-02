import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { DorvellImage } from "@/content/dorvell.schema";
import type { DorvellManual } from "@/content/dorvell.manual";
import { buildGalleryLanes } from "@/lib/gallery-lanes";
import { blurImageProps, imageAlt } from "@/lib/images";

const toolNotes: Record<string, string> = {
  "Adobe Photoshop": "Retouch / composite",
  "Adobe Lightroom": "Color grade / select",
  "Adobe InDesign": "Layout / deck",
  "Adobe Premiere": "Cuts / recaps",
  CapCut: "Fast social clips",
};

const workflow = [
  {
    step: "01",
    label: "Scout",
    copy: "Mood, fit, venue, motion, and where the light is going to behave.",
  },
  {
    step: "02",
    label: "Direct",
    copy: "Model timing meets photographer patience: small gestures, clean frames.",
  },
  {
    step: "03",
    label: "Grade",
    copy: "Polished without sanding off the sweat, texture, or personality.",
  },
  {
    step: "04",
    label: "Ship",
    copy: "Portfolio selects, social crops, recaps, decks, and campaign-ready files.",
  },
];

export function GraphicDesignGrid({ tools, images, manual }: { tools: string[]; images: DorvellImage[]; manual: DorvellManual }) {
  const lanes = buildGalleryLanes(images);
  const laneFrames = lanes
    .map((lane, index) => ({ lane, image: lane.images[index % Math.max(lane.images.length, 1)] }))
    .filter((item): item is { lane: (typeof lanes)[number]; image: DorvellImage } => Boolean(item.image));
  const heroFrame = laneFrames[3]?.image ?? laneFrames[0]?.image;
  const leadExperience = manual.experience.find((entry) => entry.proof === "verifiedByResume") ?? manual.experience[0];
  const compactTools = tools.map((tool) => tool.replace(/^Adobe\s+/, ""));
  const credentialSpine = [
    {
      label: "Study",
      value: manual.education.degree,
      detail: `${manual.education.school} / ${manual.education.date}`,
    },
    {
      label: "Practice",
      value: leadExperience.role,
      detail: `${leadExperience.dates} / ${leadExperience.location}`,
    },
    {
      label: "Stack",
      value: "Adobe photo, layout, edit",
      detail: compactTools.join(" / "),
    },
  ];

  return (
    <section className="design-section" aria-labelledby="design-title" data-studio-section="edit">
      <div className="design-console">
        <div className="design-console__copy">
          <p className="eyebrow">Design / Edit Bay</p>
          <h2 id="design-title">Shot like a story. Finished like a rollout.</h2>
          <p>
            The resume reads photographer, model, journalist, editor. The site reads simpler: Dorvell knows
            what should happen before, during, and after the shutter.
          </p>
          <div className="design-console__signals" aria-label="Creative strengths">
            <span>Photo eye</span>
            <span>Layout brain</span>
            <span>Social clock</span>
          </div>
          <div className="design-console__credential" aria-label="Resume proof points">
            {credentialSpine.map((item) => (
              <span key={item.label}>
                <em>{item.label}</em>
                <strong>{item.value}</strong>
                <small>{item.detail}</small>
              </span>
            ))}
          </div>
          <Link className="button-secondary" href="/work">
            Inspect the archive
          </Link>
        </div>

        <div className="design-console__stage" aria-label="Creative production console">
          {heroFrame ? (
            <figure className="design-monitor">
              <Image
                src={heroFrame.localOptimized.md}
                alt={imageAlt(heroFrame)}
                width={heroFrame.width}
                height={heroFrame.height}
                sizes="(max-width: 900px) 92vw, 48vw"
                {...blurImageProps(heroFrame)}
              />
              <figcaption>
                <span>Active select</span>
                <strong>{heroFrame.projectTitle ?? heroFrame.category}</strong>
              </figcaption>
              <i aria-hidden="true" />
            </figure>
          ) : null}

          <div className="design-lane-stack" aria-label="Portfolio lanes in production">
            {laneFrames.map(({ lane, image }, index) => (
              <article
                className="design-lane-card"
                key={lane.key}
                style={{ "--lane-accent": lane.accent } as CSSProperties}
              >
                <Image
                  src={image.localOptimized.md}
                  alt={imageAlt(image)}
                  width={image.width}
                  height={image.height}
                  sizes="(max-width: 900px) 42vw, 180px"
                  {...blurImageProps(image)}
                />
                <div>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{lane.label}</strong>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="design-workflow" aria-label="Production workflow">
          {workflow.map((item) => (
            <article key={item.step}>
              <span>{item.step}</span>
              <h3>{item.label}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>

        <div className="tool-marquee" aria-label="Creative tools">
          {tools.map((tool) => (
            <span key={tool}>
              <strong>{tool}</strong>
              <small>{toolNotes[tool] ?? "Production tool"}</small>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
