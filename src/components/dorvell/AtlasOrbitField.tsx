"use client";

import { useEffect, useRef } from "react";
import type { Group, Material, Mesh, Object3D, Texture } from "three";
import type { DorvellImage } from "@/content/dorvell.schema";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

type OrbitCard = {
  card: Group;
  angle: number;
  radiusX: number;
  radiusY: number;
  z: number;
  speed: number;
};

function disposeMaterial(material: Material | Material[]) {
  const materials = Array.isArray(material) ? material : [material];
  materials.forEach((item) => {
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

export function AtlasOrbitField({ images }: { images: DorvellImage[] }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion || !mountRef.current) return;

    let cleanup = () => {};
    let cancelled = false;

    async function setup() {
      const THREE = await import("three");
      if (cancelled || !mountRef.current) return;

      const mount = mountRef.current;
      const width = Math.max(mount.clientWidth, 1);
      const height = Math.max(mount.clientHeight, 1);
      const compact = width < 760;
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, compact ? 1.15 : 1.55));
      renderer.setSize(width, height);
      renderer.domElement.setAttribute("aria-hidden", "true");
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(compact ? 48 : 42, width / height, 0.1, 100);
      camera.position.set(0, 0, compact ? 9.2 : 8.4);

      const orbitGroup = new THREE.Group();
      orbitGroup.position.set(compact ? 0.15 : 1.1, compact ? -0.15 : 0, compact ? -0.3 : -0.6);
      scene.add(orbitGroup);

      const palette = ["#f0b35a", "#f04d5e", "#48c7ff", "#35e0bb", "#c8a58c"];

      for (let i = 0; i < 5; i += 1) {
        const curve = new THREE.EllipseCurve(0, 0, compact ? 2.1 + i * 0.34 : 2.8 + i * 0.52, compact ? 1.15 + i * 0.24 : 1.55 + i * 0.36, 0, Math.PI * 2, false, i * 0.18);
        const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(156));
        const material = new THREE.LineBasicMaterial({
          color: palette[i % palette.length],
          transparent: true,
          opacity: compact ? 0.12 : 0.16,
        });
        const line = new THREE.Line(geometry, material);
        line.rotation.x = 0.66 + i * 0.04;
        line.rotation.y = -0.18 + i * 0.05;
        orbitGroup.add(line);
      }

      const particleCount = compact ? 72 : 120;
      const particlePositions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i += 1) {
        particlePositions[i * 3] = (Math.random() - 0.5) * (compact ? 6.2 : 9.2);
        particlePositions[i * 3 + 1] = (Math.random() - 0.5) * (compact ? 4.6 : 5.8);
        particlePositions[i * 3 + 2] = -2.8 + Math.random() * 2.8;
      }
      const particleGeometry = new THREE.BufferGeometry();
      particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
      const particles = new THREE.Points(
        particleGeometry,
        new THREE.PointsMaterial({
          color: "#f8f1e7",
          size: compact ? 0.014 : 0.018,
          transparent: true,
          opacity: 0.22,
        }),
      );
      scene.add(particles);

      const cards: OrbitCard[] = [];
      const loader = new THREE.TextureLoader();
      const frameImages = images.slice(0, compact ? 10 : 14);
      const loadedTextures = await Promise.allSettled(frameImages.map((image) => loader.loadAsync(image.localOptimized.sm)));
      if (cancelled) {
        loadedTextures.forEach((result) => {
          if (result.status === "fulfilled") result.value.dispose();
        });
        return;
      }

      loadedTextures.forEach((result, index) => {
        if (result.status !== "fulfilled") return;
        const image = frameImages[index];
        const texture = result.value;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        const aspect = Math.min(1.45, Math.max(0.66, image.aspectRatio || image.width / image.height || 0.8));
        const cardHeight = compact ? 0.66 : 0.78;
        const cardWidth = cardHeight * aspect;
        const angle = (index / Math.max(frameImages.length, 1)) * Math.PI * 2;
        const card = new THREE.Group();
        const accent = palette[index % palette.length];

        const backing = new THREE.Mesh(
          new THREE.PlaneGeometry(cardWidth + 0.075, cardHeight + 0.075),
          new THREE.MeshBasicMaterial({
            color: accent,
            transparent: true,
            opacity: compact ? 0.13 : 0.18,
            side: THREE.DoubleSide,
            depthWrite: false,
          }),
        );
        backing.position.z = -0.015;
        card.add(backing);

        const plane = new THREE.Mesh(
          new THREE.PlaneGeometry(cardWidth, cardHeight),
          new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: compact ? 0.4 : 0.5,
            side: THREE.DoubleSide,
            depthWrite: false,
          }),
        );
        card.add(plane);

        orbitGroup.add(card);
        cards.push({
          card,
          angle,
          radiusX: compact ? 2.7 : 4.15,
          radiusY: compact ? 1.35 : 2.05,
          z: -1.2 + Math.sin(index * 1.7) * 0.7,
          speed: 0.035 + (index % 4) * 0.004,
        });
      });

      const pointer = { x: 0, y: 0 };
      const onPointer = (event: PointerEvent) => {
        const rect = mount.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * -2;
      };
      window.addEventListener("pointermove", onPointer);

      const onResize = () => {
        const nextWidth = Math.max(mount.clientWidth, 1);
        const nextHeight = Math.max(mount.clientHeight, 1);
        camera.aspect = nextWidth / nextHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(nextWidth, nextHeight);
      };
      window.addEventListener("resize", onResize);

      const clock = new THREE.Clock();
      let frame = 0;
      const animate = () => {
        frame = window.requestAnimationFrame(animate);
        const time = clock.getElapsedTime();
        orbitGroup.rotation.x += (pointer.y * 0.08 - orbitGroup.rotation.x) * 0.035;
        orbitGroup.rotation.y += (pointer.x * 0.12 - orbitGroup.rotation.y) * 0.035;
        orbitGroup.rotation.z = Math.sin(time * 0.18) * 0.045;
        particles.rotation.y = time * 0.018;
        particles.rotation.x = Math.sin(time * 0.1) * 0.08;

        cards.forEach((entry, index) => {
          const angle = entry.angle + time * entry.speed;
          entry.card.position.set(
            Math.cos(angle) * entry.radiusX,
            Math.sin(angle * 1.08) * entry.radiusY,
            entry.z + Math.sin(angle * 2 + index) * 0.22,
          );
          entry.card.lookAt(camera.position);
          entry.card.rotateZ(Math.sin(angle + time * 0.4) * 0.1);
        });

        renderer.render(scene, camera);
      };
      animate();

      cleanup = () => {
        window.cancelAnimationFrame(frame);
        window.removeEventListener("pointermove", onPointer);
        window.removeEventListener("resize", onResize);
        disposeObject(scene);
        renderer.dispose();
        renderer.forceContextLoss();
        mount.replaceChildren();
      };
    }

    setup();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [images, reducedMotion]);

  return <div ref={mountRef} className="atlas-orbit-field" aria-hidden="true" />;
}
