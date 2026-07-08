"use client";

import { useEffect, useRef } from "react";
import type { ModelingImage } from "@/components/modeling/modelingTypes";

/**
 * Wavy infinite image ribbons — raw three.js, no R3F.
 * Technique adapted from the Codrops experimental carousel (MIT): shared
 * subdivided plane, world-Y cosine curvature in the vertex shader, scroll
 * velocity coupled to both mesh translation and a jelly-wobble uniform,
 * mod-wrap looping. Scroll stays native; the field reads page scroll
 * velocity and pointer drag instead of hijacking the wheel.
 */

const VERTEX = /* glsl */ `
uniform float uScrollSpeed;
uniform float uCurveStrength;
uniform float uCurveFrequency;
varying vec2 vUv;
void main() {
  vec3 pos = position;
  vec3 world = (modelMatrix * vec4(position, 1.0)).xyz;
  float xDisplacement = uCurveStrength * cos(world.y * uCurveFrequency);
  pos.x += xDisplacement - uCurveStrength;
  pos.y += -sin(uv.x * 3.14159265) * uScrollSpeed;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  vUv = uv;
}
`;

const FRAGMENT = /* glsl */ `
uniform sampler2D uTexture;
uniform vec2 uPlaneSizes;
uniform vec2 uImageSizes;
uniform float uDim;
varying vec2 vUv;
void main() {
  vec2 ratio = vec2(
    min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
    min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
  );
  vec2 uv = vec2(
    vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
    vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
  );
  vec3 color = texture2D(uTexture, uv).rgb;
  gl_FragColor = vec4(color * uDim, 1.0);
}
`;

type ColumnSpec = {
  /** Horizontal slot in [-1, 1] of the visible width. */
  slot: number;
  factor: number;
  direction: 1 | -1;
  idleSpeed: number;
};

const COLUMNS: ColumnSpec[] = [
  { slot: -0.62, factor: 0.0009, direction: 1, idleSpeed: 0.045 },
  { slot: 0, factor: 0.0014, direction: -1, idleSpeed: 0.06 },
  { slot: 0.62, factor: 0.0011, direction: 1, idleSpeed: 0.05 },
];

type ModelingRibbonFieldProps = {
  images: ModelingImage[];
};

export default function ModelingRibbonField({ images }: ModelingRibbonFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || images.length < 6) return;

    let disposed = false;
    let cleanup: (() => void) | null = null;

    void (async () => {
      const THREE = await import("three");
      if (disposed || !containerRef.current) return;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.domElement.classList.add("modeling-ribbons__canvas");
      renderer.domElement.setAttribute("aria-hidden", "true");
      container.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 20);
      camera.position.z = 3;

      const geometry = new THREE.PlaneGeometry(1, 1, 16, 16);
      const loader = new THREE.TextureLoader();

      type Ribbon = {
        group: InstanceType<typeof THREE.Group>;
        meshes: InstanceType<typeof THREE.Mesh>[];
        materials: InstanceType<typeof THREE.ShaderMaterial>[];
        total: number;
        offset: number;
        spec: ColumnSpec;
      };

      const PLANE_W = 1.02;
      const PLANE_H = 1.36;
      const GAP = 0.14;
      const PER_COLUMN = Math.min(7, Math.max(5, Math.floor(images.length / COLUMNS.length)));

      const textures: InstanceType<typeof THREE.Texture>[] = [];
      const ribbons: Ribbon[] = [];

      COLUMNS.forEach((spec, columnIndex) => {
        const group = new THREE.Group();
        group.rotation.z = -0.085;
        const meshes: InstanceType<typeof THREE.Mesh>[] = [];
        const materials: InstanceType<typeof THREE.ShaderMaterial>[] = [];
        const step = PLANE_H + GAP;
        const total = PER_COLUMN * step;

        for (let i = 0; i < PER_COLUMN; i += 1) {
          const image = images[(columnIndex * PER_COLUMN + i) % images.length];
          const material = new THREE.ShaderMaterial({
            vertexShader: VERTEX,
            fragmentShader: FRAGMENT,
            uniforms: {
              uTexture: { value: null },
              uPlaneSizes: { value: new THREE.Vector2(PLANE_W, PLANE_H) },
              uImageSizes: { value: new THREE.Vector2(image.width || 1, image.height || 1) },
              uScrollSpeed: { value: 0 },
              uCurveStrength: { value: 0.42 },
              uCurveFrequency: { value: 0.55 },
              uDim: { value: columnIndex === 1 ? 1 : 0.82 },
            },
          });
          loader.load(image.src, (texture) => {
            if (disposed) {
              // Load resolved after unmount — free it immediately.
              texture.dispose();
              return;
            }
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.minFilter = THREE.LinearFilter;
            texture.generateMipmaps = false;
            material.uniforms.uTexture.value = texture;
            material.uniforms.uImageSizes.value.set(
              texture.image?.width ?? image.width ?? 1,
              texture.image?.height ?? image.height ?? 1,
            );
            textures.push(texture);
          });
          const mesh = new THREE.Mesh(geometry, material);
          mesh.scale.set(PLANE_W, PLANE_H, 1);
          mesh.position.y = i * step - total / 2;
          group.add(mesh);
          meshes.push(mesh);
          materials.push(material);
        }

        scene.add(group);
        ribbons.push({ group, meshes, materials, total, offset: 0, spec });
      });

      // ---- layout
      const layout = () => {
        const width = container.clientWidth || 1;
        const height = container.clientHeight || 1;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        const viewHeight = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
        const viewWidth = viewHeight * camera.aspect;
        ribbons.forEach((ribbon) => {
          ribbon.group.position.x = ribbon.spec.slot * (viewWidth / 2) * 0.92;
        });
      };
      layout();
      const resizeObserver = new ResizeObserver(layout);
      resizeObserver.observe(container);

      // ---- motion model: page scroll velocity + pointer drag, both smoothed
      let velocityTarget = 0;
      let velocity = 0;
      let lastScrollY = window.scrollY;
      let dragging = false;
      let lastPointerY = 0;

      const onScroll = () => {
        const y = window.scrollY;
        velocityTarget += (y - lastScrollY) * 1.1;
        lastScrollY = y;
      };
      const onPointerDown = (event: PointerEvent) => {
        dragging = true;
        lastPointerY = event.clientY;
        container.setPointerCapture?.(event.pointerId);
      };
      const onPointerMove = (event: PointerEvent) => {
        if (!dragging) return;
        velocityTarget += (lastPointerY - event.clientY) * 2.2;
        lastPointerY = event.clientY;
      };
      const onPointerUp = () => {
        dragging = false;
      };

      window.addEventListener("scroll", onScroll, { passive: true });
      container.addEventListener("pointerdown", onPointerDown);
      container.addEventListener("pointermove", onPointerMove);
      container.addEventListener("pointerup", onPointerUp);
      container.addEventListener("pointercancel", onPointerUp);

      // ---- run only while visible and tab active
      let inView = true;
      let tabVisible = document.visibilityState === "visible";
      const io = new IntersectionObserver(
        (entries) => {
          inView = entries.some((entry) => entry.isIntersecting);
        },
        { rootMargin: "120px 0px" },
      );
      io.observe(container);
      const onVisibility = () => {
        tabVisible = document.visibilityState === "visible";
      };
      document.addEventListener("visibilitychange", onVisibility);

      let raf = 0;
      let lastTime = performance.now();
      const wrap = (value: number, total: number) => ((((value + total / 2) % total) + total) % total) - total / 2;

      const tick = (time: number) => {
        raf = requestAnimationFrame(tick);
        const dt = Math.min((time - lastTime) / 1000, 0.05);
        lastTime = time;
        if (!inView || !tabVisible) return;

        // frame-rate independent exponential decay toward the target, then bleed the target
        velocity += (velocityTarget - velocity) * (1 - Math.pow(0.004, dt));
        velocityTarget *= Math.pow(0.02, dt);

        const wobble = Math.max(-0.28, Math.min(0.28, velocity * 0.004));

        ribbons.forEach((ribbon) => {
          const drift = ribbon.spec.idleSpeed * dt;
          ribbon.offset += ribbon.spec.direction * (velocity * ribbon.spec.factor + drift);
          const step = ribbon.total / ribbon.meshes.length;
          ribbon.meshes.forEach((mesh, i) => {
            mesh.position.y = wrap(i * step - ribbon.total / 2 + ribbon.offset, ribbon.total);
          });
          ribbon.materials.forEach((material) => {
            material.uniforms.uScrollSpeed.value = wobble * ribbon.spec.direction;
          });
        });

        renderer.render(scene, camera);
      };
      raf = requestAnimationFrame(tick);

      cleanup = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        resizeObserver.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("scroll", onScroll);
        container.removeEventListener("pointerdown", onPointerDown);
        container.removeEventListener("pointermove", onPointerMove);
        container.removeEventListener("pointerup", onPointerUp);
        container.removeEventListener("pointercancel", onPointerUp);
        ribbons.forEach((ribbon) => ribbon.materials.forEach((material) => material.dispose()));
        textures.forEach((texture) => texture.dispose());
        geometry.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [images]);

  return <div ref={containerRef} className="modeling-ribbons__field" aria-hidden="true" />;
}
