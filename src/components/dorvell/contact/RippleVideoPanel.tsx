"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import type { StudioVideo } from "./studioTypes";

/* Reduced-motion as an external store so the FIRST client render already has the
   correct value (no post-paint autoplay flash for reduced-motion users). */
const subscribeReducedMotion = (cb: () => void) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const getReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const getServerReducedMotion = () => false;

/* Desktop plays the near-original HD cut, mobile the compressed one — same
   responsive rule as the Creative page's VideoPlayer (resolved at load time). */
const isMobileViewport = () =>
  typeof window !== "undefined" && Boolean(window.matchMedia?.("(max-width: 760px)").matches);
const clipSrc = (v: StudioVideo) => (isMobileViewport() ? v.mobile : v.mp4);

type PanelControls = { pause: () => void; resume: () => void };

/** Small pause/play toggle so auto-playing motion has a control (WCAG 2.2.2). */
function PauseToggle({ paused, onToggle }: { paused: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className="ripple-panel__pause"
      onClick={onToggle}
      aria-pressed={paused}
      aria-label={paused ? "Play the creative reel" : "Pause the creative reel"}
    >
      <span aria-hidden="true">{paused ? "▶" : "❚❚"}</span>
    </button>
  );
}

/* ----------------------------- capability probe ---------------------------- */

type Capability = "webgl" | "crossfade";

let capability: Capability | null = null;
const subscribeNever = () => () => {};

function detectCapability(): Capability {
  if (typeof window === "undefined") return "crossfade";
  if (capability) return capability;
  const fine = window.matchMedia("(pointer: fine)").matches;
  const wide = window.innerWidth > 900;
  const saveData = Boolean(
    (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData,
  );
  let webgl = false;
  try {
    const canvas = document.createElement("canvas");
    webgl = Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    webgl = false;
  }
  capability = webgl && fine && wide && !saveData ? "webgl" : "crossfade";
  return capability;
}
const getCapability = () => detectCapability();
const getServerCapability = (): Capability => "crossfade";

/* ------------------------------ shaders ----------------------------------- */

const VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

// Water-ripple crossfade between two cover-fitted video textures. A ring of
// displacement rides the expanding reveal front for the "drop in water" feel.
const FRAG = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uCurr;
  uniform sampler2D uNext;
  uniform float uProgress;
  uniform vec2 uCenter;
  uniform float uMaxDist;
  uniform float uPanelAspect;
  uniform float uCurrAspect;
  uniform float uNextAspect;

  vec2 coverUv(vec2 uv, float texAspect, float panelAspect) {
    vec2 scale = vec2(1.0);
    if (texAspect > panelAspect) {
      scale.x = panelAspect / texAspect;
    } else {
      scale.y = texAspect / panelAspect;
    }
    return (uv - 0.5) * scale + 0.5;
  }

  void main() {
    float dist = distance(vUv, uCenter);
    float front = uProgress * uMaxDist;

    float ring = 1.0 - smoothstep(0.0, 0.16, abs(dist - front));
    vec2 dir = normalize(vUv - uCenter + vec2(1e-4));
    float ripple = sin(dist * 60.0 - uProgress * 26.0) * ring * 0.045 * (1.0 - uProgress * 0.5);
    vec2 dispUv = vUv + dir * ripple;

    vec2 uvC = coverUv(dispUv, uCurrAspect, uPanelAspect);
    vec2 uvN = coverUv(dispUv, uNextAspect, uPanelAspect);

    vec3 curr = texture2D(uCurr, uvC).rgb;
    vec3 next = texture2D(uNext, uvN).rgb;

    float reveal = smoothstep(front + 0.02, front - 0.02, dist);
    vec3 color = mix(curr, next, reveal);
    color += ring * 0.06 * (1.0 - uProgress);
    gl_FragColor = vec4(color, 1.0);
  }
`;

/* ------------------------------ utilities --------------------------------- */

function shuffle<T>(input: T[]): T[] {
  const out = input.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const videoAspect = (el: HTMLVideoElement) =>
  el.videoWidth && el.videoHeight ? el.videoWidth / el.videoHeight : 16 / 9;

/* ------------------------------ component ---------------------------------- */

type Props = { videos: StudioVideo[]; className?: string };

export function RippleVideoPanel({ videos, className }: Props) {
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, getServerReducedMotion);
  const capabilityMode = useSyncExternalStore(subscribeNever, getCapability, getServerCapability);
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<PanelControls | null>(null);
  const [paused, setPaused] = useState(false);

  const mode: "static" | "webgl" | "crossfade" =
    reducedMotion || videos.length === 0 ? "static" : capabilityMode;

  const togglePaused = () => {
    setPaused((wasPaused) => {
      const next = !wasPaused;
      if (next) controlsRef.current?.pause();
      else controlsRef.current?.resume();
      return next;
    });
  };

  useEffect(() => {
    if (mode !== "webgl") return;
    const mount = mountRef.current;
    if (!mount) return;

    let cancelled = false;
    let cleanup = () => {};
    const order = shuffle(videos);

    async function setup() {
      const THREE = await import("three");
      if (cancelled || !mount) return;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      renderer.setClearColor(0x090a09, 1);
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);

      const makeVideo = (v: StudioVideo) => {
        const el = document.createElement("video");
        // required to texture a cross-origin (S3/CDN) video into WebGL without
        // tainting — must be set before src; the bucket sends Access-Control-Allow-Origin.
        el.crossOrigin = "anonymous";
        el.src = clipSrc(v);
        el.muted = true;
        el.loop = true;
        el.playsInline = true;
        el.preload = "auto";
        el.setAttribute("aria-hidden", "true");
        el.style.cssText = "position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;";
        mount.appendChild(el);
        void el.play().catch(() => {});
        return el;
      };

      const vids = [makeVideo(order[0]), makeVideo(order[1 % order.length])];
      const texs = vids.map((el) => {
        const t = new THREE.VideoTexture(el);
        t.colorSpace = THREE.SRGBColorSpace;
        t.minFilter = THREE.LinearFilter;
        t.magFilter = THREE.LinearFilter;
        return t;
      });

      let showing = 0;
      let orderPtr = 2;
      let animating = false;

      const uniforms = {
        uCurr: { value: texs[0] },
        uNext: { value: texs[1] },
        uProgress: { value: 0 },
        uCenter: { value: new THREE.Vector2(0.5, 0.5) },
        uMaxDist: { value: 1.5 },
        uPanelAspect: { value: mount.clientWidth / Math.max(mount.clientHeight, 1) },
        uCurrAspect: { value: videoAspect(vids[0]) },
        uNextAspect: { value: videoAspect(vids[1]) },
      };

      const material = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG });
      const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
      scene.add(quad);

      let raf = 0;
      let transitionRaf = 0;
      let visible = true;
      let pausedByUser = false;
      let contextLost = false;
      let lastRender = 0;
      const renderFrame = (now: number) => {
        raf = requestAnimationFrame(renderFrame);
        if (contextLost) return;
        // 60fps during a ripple; ~30fps ambient to cut idle GPU cost
        if (!animating && now - lastRender < 32) return;
        lastRender = now;
        uniforms.uCurr.value = texs[showing];
        uniforms.uNext.value = texs[1 - showing];
        uniforms.uCurrAspect.value = videoAspect(vids[showing]);
        uniforms.uNextAspect.value = videoAspect(vids[1 - showing]);
        renderer.render(scene, camera);
      };
      const start = () => {
        if (!raf) raf = requestAnimationFrame(renderFrame);
      };
      const stop = () => {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      };

      const canvas = renderer.domElement;
      const onContextLost = (event: Event) => {
        event.preventDefault();
        contextLost = true;
        stop();
      };
      const onContextRestored = () => {
        contextLost = false;
        if (visible && !document.hidden && !pausedByUser) start();
      };
      canvas.addEventListener("webglcontextlost", onContextLost);
      canvas.addEventListener("webglcontextrestored", onContextRestored);

      const transition = (cx: number, cy: number) => {
        if (animating || contextLost) return;
        // skip if the incoming clip hasn't decoded a frame yet (avoids a black reveal)
        if (vids[1 - showing].readyState < 2) return;
        animating = true;
        uniforms.uCenter.value.set(cx, cy);
        const corners = [
          Math.hypot(cx, cy),
          Math.hypot(1 - cx, cy),
          Math.hypot(cx, 1 - cy),
          Math.hypot(1 - cx, 1 - cy),
        ];
        uniforms.uMaxDist.value = Math.max(...corners) + 0.05;

        const duration = 1150;
        let startT = 0;
        const step = (now: number) => {
          if (!startT) startT = now;
          const p = Math.min(1, (now - startT) / duration);
          uniforms.uProgress.value = easeInOut(p);
          if (p < 1) {
            transitionRaf = requestAnimationFrame(step);
            return;
          }
          // commit: the revealed clip becomes current; load a fresh next clip
          showing = 1 - showing;
          uniforms.uProgress.value = 0;
          const hidden = 1 - showing;
          const el = vids[hidden];
          el.pause();
          el.src = clipSrc(order[orderPtr % order.length]);
          orderPtr += 1;
          el.load();
          void el.play().catch(() => {});
          animating = false;
        };
        transitionRaf = requestAnimationFrame(step);
      };

      const onEnter = (event: PointerEvent) => {
        const rect = mount.getBoundingClientRect();
        const cx = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
        const cy = Math.min(Math.max(1 - (event.clientY - rect.top) / rect.height, 0), 1);
        transition(cx, cy);
      };
      mount.addEventListener("pointerenter", onEnter);

      const onResize = () => {
        renderer.setSize(mount.clientWidth, mount.clientHeight);
        uniforms.uPanelAspect.value = mount.clientWidth / Math.max(mount.clientHeight, 1);
      };
      const resizeObserver = new ResizeObserver(onResize);
      resizeObserver.observe(mount);

      const io = new IntersectionObserver(
        (entries) => {
          visible = entries[0]?.isIntersecting ?? true;
          if (visible && !document.hidden && !pausedByUser) {
            vids.forEach((el) => void el.play().catch(() => {}));
            start();
          } else {
            vids.forEach((el) => el.pause());
            stop();
          }
        },
        { threshold: 0.05 },
      );
      io.observe(mount);

      const onVisibility = () => {
        if (document.hidden) {
          vids.forEach((el) => el.pause());
          stop();
        } else if (visible && !pausedByUser) {
          vids.forEach((el) => void el.play().catch(() => {}));
          start();
        }
      };
      document.addEventListener("visibilitychange", onVisibility);

      start();

      controlsRef.current = {
        pause: () => {
          pausedByUser = true;
          vids.forEach((el) => el.pause());
          stop();
        },
        resume: () => {
          pausedByUser = false;
          if (visible && !document.hidden) {
            vids.forEach((el) => void el.play().catch(() => {}));
            start();
          }
        },
      };

      cleanup = () => {
        controlsRef.current = null;
        stop();
        if (transitionRaf) cancelAnimationFrame(transitionRaf);
        transitionRaf = 0;
        mount.removeEventListener("pointerenter", onEnter);
        document.removeEventListener("visibilitychange", onVisibility);
        canvas.removeEventListener("webglcontextlost", onContextLost);
        canvas.removeEventListener("webglcontextrestored", onContextRestored);
        resizeObserver.disconnect();
        io.disconnect();
        texs.forEach((t) => t.dispose());
        material.dispose();
        quad.geometry.dispose();
        renderer.dispose();
        // release the GL context deterministically so repeated /contact visits
        // don't exhaust Chrome's ~16-context cap and blank a canvas.
        renderer.forceContextLoss();
        vids.forEach((el) => {
          el.pause();
          el.removeAttribute("src");
          el.load();
          el.remove();
        });
        if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      };
    }

    void setup();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [mode, videos]);

  if (mode === "static") {
    const first = videos[0];
    return (
      <div className={className ? `ripple-panel ${className}` : "ripple-panel"} data-mode="static">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {first ? <img className="ripple-panel__poster" src={first.poster} alt="" /> : null}
        <span className="ripple-panel__tag" aria-hidden="true">
          Creative reel
        </span>
      </div>
    );
  }

  if (mode === "crossfade") {
    return (
      <CrossfadeVideoPanel
        videos={videos}
        className={className}
        controlsRef={controlsRef}
        paused={paused}
        onToggle={togglePaused}
      />
    );
  }

  return (
    <div
      ref={mountRef}
      className={className ? `ripple-panel ${className}` : "ripple-panel"}
      data-mode="webgl"
      role="img"
      aria-label="Creative reel of Dorvell Ferguson's work."
    >
      <span className="ripple-panel__hint" aria-hidden="true">
        Hover to ripple
      </span>
      <PauseToggle paused={paused} onToggle={togglePaused} />
    </div>
  );
}

/* ------------------------- crossfade fallback ------------------------------ */

function CrossfadeVideoPanel({
  videos,
  className,
  controlsRef,
  paused,
  onToggle,
}: {
  videos: StudioVideo[];
  className?: string;
  controlsRef: RefObject<PanelControls | null>;
  paused: boolean;
  onToggle: () => void;
}) {
  const aRef = useRef<HTMLVideoElement>(null);
  const bRef = useRef<HTMLVideoElement>(null);
  const stateRef = useRef({ order: shuffle(videos), ptr: 1, front: 0, busy: false, paused: false });

  useEffect(() => {
    const a = aRef.current;
    const b = bRef.current;
    if (!a || !b) return;
    const st = stateRef.current;
    a.src = clipSrc(st.order[0]);
    b.src = clipSrc(st.order[1 % st.order.length]);
    void a.play().catch(() => {});
    void b.play().catch(() => {});
    controlsRef.current = {
      pause: () => {
        st.paused = true;
        a.pause();
        b.pause();
      },
      resume: () => {
        st.paused = false;
        void a.play().catch(() => {});
        void b.play().catch(() => {});
      },
    };
    return () => {
      controlsRef.current = null;
      [a, b].forEach((el) => {
        el.pause();
        el.removeAttribute("src");
        el.load();
      });
    };
  }, [controlsRef]);

  const swap = () => {
    const a = aRef.current;
    const b = bRef.current;
    if (!a || !b) return;
    const st = stateRef.current;
    if (st.busy || st.paused) return;
    st.busy = true;
    // The hidden buffer already holds the NEXT clip (preloaded + decoding), so
    // we only crossfade opacity here — never swap src mid-fade (which flashed
    // blank). After the fade, stage the following clip into the now-hidden one.
    const showingA = st.front === 0;
    const incoming = showingA ? b : a;
    const outgoing = showingA ? a : b;
    incoming.style.opacity = "1";
    outgoing.style.opacity = "0";
    st.front = showingA ? 1 : 0;
    window.setTimeout(() => {
      st.ptr = (st.ptr + 1) % st.order.length;
      outgoing.src = clipSrc(st.order[st.ptr]);
      outgoing.load();
      if (!st.paused) void outgoing.play().catch(() => {});
      st.busy = false;
    }, 850);
  };

  return (
    <div
      className={className ? `ripple-panel ${className}` : "ripple-panel"}
      data-mode="crossfade"
      onPointerEnter={swap}
      role="img"
      aria-label="Creative reel of Dorvell Ferguson's work."
    >
      <video ref={aRef} className="ripple-panel__video" style={{ opacity: 1 }} muted loop playsInline crossOrigin="anonymous" aria-hidden="true" />
      <video ref={bRef} className="ripple-panel__video" style={{ opacity: 0 }} muted loop playsInline crossOrigin="anonymous" aria-hidden="true" />
      <span className="ripple-panel__hint" aria-hidden="true">
        Hover to switch
      </span>
      <PauseToggle paused={paused} onToggle={onToggle} />
    </div>
  );
}
