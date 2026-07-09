"use client";

import dynamic from "next/dynamic";
import { CreativeLightboxProvider } from "./CreativeLightbox";
import { CreativeModeSwitch } from "./CreativeModeSwitch";
import { useCreativeMode } from "./creativeMode";
import { CreativeHeroVideo } from "./CreativeHeroVideo";
import { CreativeManifesto } from "./CreativeManifesto";
import { FeaturedCreativeFilm } from "./FeaturedCreativeFilm";
import { CreativeRooms } from "./CreativeRooms";
import { ScrollMorphGallery } from "./ScrollMorphGallery";
import { ReelRunway } from "./ReelRunway";
import { CreativePhotoshootGallery } from "./CreativePhotoshootGallery";
import { CreativeArchive } from "./CreativeArchive";
import { DirectorNotebook } from "./DirectorNotebook";
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

function CreativeControlRail() {
  return (
    <div className="cw-controlbar">
      <div className="cw-container cw-container--wide cw-controlbar__inner">
        <span className="cw-controlbar__brand">Creative Worlds</span>
        <CreativeModeSwitch variant="bar" />
      </div>
    </div>
  );
}

export function CreativeExperience() {
  const { mode } = useCreativeMode();
  const cinematic = mode === "cinematic";

  return (
    <CreativeLightboxProvider>
      <div className="cw-experience">
        <CreativeHeroVideo />
        <div id="cw-body">
          <CreativeControlRail />
          <CreativeManifesto />
          <FeaturedCreativeFilm />
          <CreativeRooms />
          <ScrollMorphGallery />
          <ReelRunway />
          <CreativePhotoshootGallery />
          <CreativeArchive />
          <DirectorNotebook />
          <PhotomodeGraffiti />
          {cinematic ? <CreativeParticleWord word="WORLD" /> : null}
          {cinematic ? <CreativeOrbitRing /> : null}
          <CreativeCTA />
        </div>
      </div>
    </CreativeLightboxProvider>
  );
}
