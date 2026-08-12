"use client";

import dynamic from "next/dynamic";
import { CreativeLightboxProvider } from "./CreativeLightbox";
import { useCreativeMode } from "./creativeMode";
import { CreativeHeroVideo } from "./CreativeHeroVideo";
import { CreativeManifesto } from "./CreativeManifesto";
import { FeaturedCreativeFilm } from "./FeaturedCreativeFilm";
import { ScrollMorphGallery } from "./ScrollMorphGallery";
import { ReelRunway } from "./ReelRunway";
import { CreativePhotoshootGallery } from "./CreativePhotoshootGallery";
import { CreativeArchive } from "./CreativeArchive";
import { PhotomodeGraffiti } from "./PhotomodeGraffiti";
import { CreativeCTA } from "./CreativeCTA";

// Progressive-enhancement toys: client-only, code-split, cinematic mode only.
const CreativeParticleWord = dynamic(
  () => import("./CreativeParticleWord").then((m) => m.CreativeParticleWord),
  { ssr: false },
);
const CreativeOrbitRing = dynamic(() => import("./CreativeOrbitRing").then((m) => m.CreativeOrbitRing), {
  ssr: false,
});

export function CreativeExperience() {
  const { mode } = useCreativeMode();
  const cinematic = mode === "cinematic";

  return (
    <CreativeLightboxProvider>
      <div className="cw-experience">
        <CreativeHeroVideo />
        <div id="cw-body">
          <CreativeManifesto />
          <FeaturedCreativeFilm />
          <ScrollMorphGallery />
          <ReelRunway />
          <CreativePhotoshootGallery />
          <CreativeArchive />
          <PhotomodeGraffiti />
          {cinematic ? <CreativeParticleWord word="WORLD" /> : null}
          {cinematic ? <CreativeOrbitRing /> : null}
          <CreativeCTA />
        </div>
      </div>
    </CreativeLightboxProvider>
  );
}
