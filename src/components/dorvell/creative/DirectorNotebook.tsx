"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";
import { resolveCreativeAsset } from "@/lib/creative-assets";
import { creativeSceneIdeas, getCreativeItem } from "@/content/creative";
import { Reveal } from "./Reveal";

const STATUS_LABEL: Record<string, string> = {
  concept: "Concept",
  "in-progress": "In progress",
  shot: "Shot",
  released: "Released",
};

/**
 * Section 9 — Director's Notebook. Future scene concepts as film-treatment
 * cards (mood, location, shot language, runtime, status) — proof that Dorvell
 * is building worlds, not just uploading media.
 */
export function DirectorNotebook() {
  return (
    <section className="cw-section cw-notebook" aria-labelledby="cw-notebook-title">
      <div className="cw-container cw-container--wide">
        <div className="cw-section__head">
          <p className="cw-eyebrow">Director&rsquo;s Notebook</p>
          <h2 id="cw-notebook-title" className="cw-h2">
            Scenes in progress.
          </h2>
          <p className="cw-lede">
            30–45 second worlds still being built — mood, location, and shot language for what comes next.
          </p>
        </div>

        <div className="cw-notebook__grid">
          {creativeSceneIdeas.map((scene, index) => {
            const texture = scene.textureSlug ? getCreativeItem(scene.textureSlug) : undefined;
            return (
              <Reveal
                key={scene.id}
                as="article"
                className={cn("cw-scene", `cw-scene--${scene.status}`)}
                style={{ transitionDelay: `${(index % 4) * 50}ms` }}
              >
                {texture ? (
                  <div className="cw-scene__texture" aria-hidden="true">
                    <Image
                      src={resolveCreativeAsset(texture.thumbSrc)}
                      alt=""
                      fill
                      unoptimized
                      sizes="360px"
                      placeholder={texture.blurDataURL ? "blur" : "empty"}
                      blurDataURL={texture.blurDataURL}
                      className="cw-video__poster"
                    />
                  </div>
                ) : null}
                <div className="cw-scene__content">
                  <div className="cw-scene__head">
                    <span className="cw-scene__status">{STATUS_LABEL[scene.status] ?? scene.status}</span>
                    <span className="cw-scene__runtime">{scene.runtime}</span>
                  </div>
                  <h3 className="cw-scene__title">{scene.title}</h3>
                  <p className="cw-scene__mood">
                    {scene.mood} · {scene.location}
                  </p>
                  <p className="cw-scene__note">{scene.note}</p>
                  <p className="cw-scene__shot">
                    <span>Shot language</span>
                    {scene.shotLanguage}
                  </p>
                  <div className="cw-scene__tags">
                    {scene.tags.map((tag) => (
                      <span key={tag} className="cw-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
