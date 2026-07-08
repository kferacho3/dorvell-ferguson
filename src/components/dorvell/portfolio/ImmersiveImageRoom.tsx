"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { Material, Mesh, Object3D, Texture } from "three";
import type { DorvellImage } from "@/content/dorvell.schema";
import { blurImageProps, imageAlt } from "@/lib/images";
import { getCategoryDef, imageCategories } from "@/lib/portfolio-taxonomy";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { PortfolioLightbox } from "./PortfolioLightbox";

type NavigatorSignals = Navigator & {
  connection?: { saveData?: boolean; effectiveType?: string };
  deviceMemory?: number;
};

function canRunRoom() {
  if (typeof window === "undefined") return false;
  const navigatorInfo = window.navigator as NavigatorSignals;
  const connection = navigatorInfo.connection;
  const lowData =
    connection?.saveData || connection?.effectiveType === "slow-2g" || connection?.effectiveType === "2g";
  const constrainedMemory = Boolean(navigatorInfo.deviceMemory && navigatorInfo.deviceMemory <= 4);
  const tiny = window.matchMedia("(max-width: 520px)").matches;
  return !lowData && !constrainedMemory && !tiny;
}

function disposeMaterial(material: Material | Material[]) {
  const list = Array.isArray(material) ? material : [material];
  list.forEach((item) => {
    const textured = item as Material & { map?: Texture | null };
    textured.map?.dispose();
    item.dispose();
  });
}
function disposeObject(object: Object3D) {
  object.traverse((child) => {
    const mesh = child as Mesh;
    mesh.geometry?.dispose();
    if (mesh.material) disposeMaterial(mesh.material);
  });
}

const VERTEX = /* glsl */ `
  uniform float uSpeed;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    p.z += sin(uv.x * 3.14159265) * uSpeed * 0.35;
    p.y *= 1.0 - abs(uSpeed) * 0.04;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const FRAGMENT = /* glsl */ `
  precision highp float;
  uniform sampler2D uTex;
  uniform float uSpeed;
  uniform float uImageAspect;
  uniform float uPlaneAspect;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    vec2 ratio = vec2(
      min(uPlaneAspect / uImageAspect, 1.0),
      min((1.0 / uPlaneAspect) / (1.0 / uImageAspect), 1.0)
    );
    vec2 uv = vec2(
      vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
      vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
    );
    float shift = clamp(uSpeed, -1.0, 1.0) * 0.008;
    float r = texture2D(uTex, uv + vec2(shift, 0.0)).r;
    float g = texture2D(uTex, uv).g;
    float b = texture2D(uTex, uv - vec2(shift, 0.0)).b;
    vec3 col = vec3(r, g, b);
    float d = distance(vUv, vec2(0.5));
    col *= smoothstep(0.9, 0.32, d) * 0.4 + 0.6;
    gl_FragColor = vec4(col, uOpacity);
  }
`;

/**
 * Immersive Image Room — a raw three.js curved image wall (no R3F). Rows of
 * planes wrap infinitely; drag/wheel scroll feeds a velocity uniform that bends
 * the planes ("whip"), settling flat when idle. Curvature + inward rotation are
 * applied per-frame in JS so the wall reads like it wraps around a drum. Clicks
 * raycast to open the lightbox. Device-gated, DPR-capped, IntersectionObserver-
 * mounted, paused offscreen/hidden, fully disposed. Renders a DOM fallback grid
 * when WebGL can't/ shouldn't run (small screens, reduced motion, save-data).
 */
export function ImmersiveImageRoom({ images }: { images: DorvellImage[] }) {
  const reducedMotion = usePrefersReducedMotion();
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglActive, setWebglActive] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const room = useMemo(() => images.slice(0, 14), [images]);

  useEffect(() => {
    if (reducedMotion || !mountRef.current || room.length < 4 || !canRunRoom()) return;

    let cleanup = () => {};
    let cancelled = false;

    async function setup() {
      const THREE = await import("three");
      if (cancelled || !mountRef.current) return;
      const mount = mountRef.current;
      const width = Math.max(mount.clientWidth, 1);
      const height = Math.max(mount.clientHeight, 1);
      const compact = width < 820;
      const rows = compact ? 1 : 2;

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !compact, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, compact ? 1.5 : 2));
      renderer.setSize(width, height);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.domElement.setAttribute("aria-hidden", "true");
      mount.appendChild(renderer.domElement);
      // Assign a disposal cleanup up-front so a teardown DURING async texture
      // load (scroll away / navigate / toggle reduced-motion) still releases the
      // GPU context and canvas instead of leaking one WebGL context per cycle.
      cleanup = () => {
        renderer.dispose();
        renderer.forceContextLoss();
        mount.replaceChildren();
      };

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 100);
      camera.position.z = compact ? 3.4 : 4.8;

      const cardH = 1.5;
      const cardW = 1.15;
      const planeAspect = cardW / cardH;
      const gap = 0.28;
      const rowGap = 0.34;
      const speedUniform = { value: 0 };

      const geometry = new THREE.PlaneGeometry(cardW, cardH, 24, 1);
      const loader = new THREE.TextureLoader();
      const results = await Promise.allSettled(room.map((image) => loader.loadAsync(image.localOptimized.sm)));
      if (cancelled) {
        results.forEach((result) => result.status === "fulfilled" && result.value.dispose());
        geometry.dispose();
        return;
      }

      type Plane = { mesh: Mesh; baseX: number; row: number; imageIndex: number };
      const planes: Plane[] = [];
      const rowCounts = new Array(rows).fill(0);

      results.forEach((result, index) => {
        if (result.status !== "fulfilled") return;
        const image = room[index];
        const texture = result.value;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = true;

        const row = index % rows;
        const withinIndex = rowCounts[row];
        rowCounts[row] += 1;

        const material = new THREE.ShaderMaterial({
          uniforms: {
            uTex: { value: texture },
            uSpeed: speedUniform,
            uImageAspect: { value: image.width / image.height },
            uPlaneAspect: { value: planeAspect },
            uOpacity: { value: 1 },
          },
          vertexShader: VERTEX,
          fragmentShader: FRAGMENT,
          transparent: true,
          side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData.imageIndex = index;
        scene.add(mesh);
        planes.push({ mesh, baseX: withinIndex * (cardW + gap), row, imageIndex: index });
      });

      const periods = rowCounts.map((count: number) => Math.max(1, count) * (cardW + gap));
      const rowSpeed = [1, 0.82];
      const rowDir = [1, -1];
      const curveK = 0.05;
      const rotK = 0.16;

      let baseScroll = 0;
      let velocity = 0;
      let running = false;
      let rafId = 0;
      let lastTime = 0;
      let dragging = false;
      let dragLast = 0;
      let dragVel = 0;
      let downX = 0;
      let downY = 0;
      let moved = 0;

      const positionPlanes = () => {
        for (const plane of planes) {
          const period = periods[plane.row];
          const rowScroll = baseScroll * rowSpeed[plane.row] * rowDir[plane.row];
          let x = (((plane.baseX - rowScroll) % period) + period) % period;
          if (x > period / 2) x -= period;
          plane.mesh.position.x = x;
          plane.mesh.position.y = (plane.row - (rows - 1) / 2) * (cardH + rowGap);
          plane.mesh.position.z = -curveK * x * x;
          plane.mesh.rotation.y = -x * rotK;
        }
      };

      const tick = (time: number) => {
        if (!running) return;
        const dt = lastTime ? Math.min(0.05, (time - lastTime) / 1000) : 1 / 60;
        lastTime = time;
        if (!dragging) {
          baseScroll += velocity * dt * 60;
          velocity *= Math.pow(0.92, dt * 60);
          if (Math.abs(velocity) < 0.001) velocity = 0;
        }
        speedUniform.value += (velocity * 0.35 - speedUniform.value) * 0.1;
        positionPlanes();
        renderer.render(scene, camera);
        rafId = window.requestAnimationFrame(tick);
      };
      const start = () => {
        if (running) return;
        running = true;
        lastTime = 0;
        rafId = window.requestAnimationFrame(tick);
      };
      const stop = () => {
        running = false;
        if (rafId) window.cancelAnimationFrame(rafId);
      };

      const raycaster = new THREE.Raycaster();
      const openAtPointer = (clientX: number, clientY: number) => {
        const rect = mount.getBoundingClientRect();
        const ndc = new THREE.Vector2(
          ((clientX - rect.left) / rect.width) * 2 - 1,
          -((clientY - rect.top) / rect.height) * 2 + 1,
        );
        raycaster.setFromCamera(ndc, camera);
        const hits = raycaster.intersectObjects(planes.map((plane) => plane.mesh));
        const first = hits[0]?.object;
        if (first && typeof first.userData.imageIndex === "number") {
          setLightbox(first.userData.imageIndex as number);
        }
      };

      const onPointerDown = (event: PointerEvent) => {
        dragging = true;
        dragLast = event.clientX;
        dragVel = 0;
        downX = event.clientX;
        downY = event.clientY;
        moved = 0;
        mount.setPointerCapture(event.pointerId);
      };
      const onPointerMove = (event: PointerEvent) => {
        if (!dragging) return;
        const dx = event.clientX - dragLast;
        dragLast = event.clientX;
        dragVel = dx;
        moved += Math.abs(dx);
        baseScroll -= dx * 0.01;
      };
      const onPointerUp = (event: PointerEvent) => {
        if (!dragging) return;
        dragging = false;
        velocity = -dragVel * 0.01;
        try {
          mount.releasePointerCapture(event.pointerId);
        } catch {
          /* already released */
        }
        const dist = Math.hypot(event.clientX - downX, event.clientY - downY);
        if (dist < 6 && moved < 6) openAtPointer(event.clientX, event.clientY);
      };
      const onWheel = (event: WheelEvent) => {
        const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
        if (!horizontal) return;
        event.preventDefault();
        velocity += event.deltaX * 0.004;
      };
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          velocity += 0.12;
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          velocity -= 0.12;
        }
      };
      const onResize = () => {
        const w = Math.max(mount.clientWidth, 1);
        const h = Math.max(mount.clientHeight, 1);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      const intersection = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) start();
          else stop();
        },
        { threshold: 0.02 },
      );
      intersection.observe(mount);
      const onVisibility = () => {
        if (document.hidden) {
          stop();
          return;
        }
        const rect = mount.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) start();
      };

      mount.addEventListener("pointerdown", onPointerDown);
      mount.addEventListener("pointermove", onPointerMove);
      mount.addEventListener("pointerup", onPointerUp);
      mount.addEventListener("pointercancel", onPointerUp);
      mount.addEventListener("wheel", onWheel, { passive: false });
      mount.addEventListener("keydown", onKeyDown);
      window.addEventListener("resize", onResize);
      document.addEventListener("visibilitychange", onVisibility);

      positionPlanes();
      renderer.render(scene, camera);
      setWebglActive(true);

      cleanup = () => {
        stop();
        intersection.disconnect();
        mount.removeEventListener("pointerdown", onPointerDown);
        mount.removeEventListener("pointermove", onPointerMove);
        mount.removeEventListener("pointerup", onPointerUp);
        mount.removeEventListener("pointercancel", onPointerUp);
        mount.removeEventListener("wheel", onWheel);
        mount.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("resize", onResize);
        document.removeEventListener("visibilitychange", onVisibility);
        disposeObject(scene);
        geometry.dispose();
        renderer.dispose();
        renderer.forceContextLoss();
        mount.replaceChildren();
      };
    }

    setup();
    return () => {
      cancelled = true;
      cleanup();
      setWebglActive(false);
    };
  }, [reducedMotion, room]);

  if (room.length < 4) return null;

  return (
    <section className="pf-room" aria-labelledby="pf-room-title">
      <div className="pf-container pf-room__head">
        <div>
          <p className="pf-eyebrow">Immersive Room</p>
          <h2 id="pf-room-title">Walk the wall.</h2>
        </div>
        <p>Drag or swipe to move through the room; click any frame to open it. A calm grid stands in where motion isn&rsquo;t welcome.</p>
      </div>

      <div className="pf-room__stage" data-webgl={webglActive ? "true" : "false"}>
        <div
          ref={mountRef}
          className="pf-room__canvas"
          role="group"
          aria-label="Immersive image wall — drag to explore, click a frame to open"
          tabIndex={0}
        />
        {/* Kept keyboard-accessible even under WebGL: hidden behind the canvas for
            mouse users, but revealed on :focus-within so keyboard/AT users can open
            frames (WCAG 2.1.1) — the canvas itself is decorative/aria-hidden. */}
        <div className="pf-room__fallback">
          {room.map((image, index) => {
            const def = getCategoryDef(imageCategories(image)[0]);
            return (
              <button
                key={image.id}
                type="button"
                className="pf-room__tile pf-frame pf-frame--cover"
                aria-label={`Open ${def.label} frame ${index + 1}: ${imageAlt(image)}`}
                style={{ "--lane-accent": def.accent } as CSSProperties}
                onClick={() => setLightbox(index)}
              >
                <Image
                  src={image.localOptimized.sm}
                  alt={imageAlt(image)}
                  width={image.width}
                  height={image.height}
                  sizes="(max-width: 760px) 44vw, 20vw"
                  loading="lazy"
                  unoptimized
                  {...blurImageProps(image)}
                />
              </button>
            );
          })}
        </div>
      </div>

      {lightbox !== null ? (
        <PortfolioLightbox
          images={room}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onNavigate={(index) => setLightbox(index)}
        />
      ) : null}
    </section>
  );
}
