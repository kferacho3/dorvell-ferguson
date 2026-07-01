"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

export function EditorialLensField() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion || !mountRef.current) return;
    let cleanup = () => {};
    let cancelled = false;

    async function setup() {
      const THREE = await import("three");
      if (cancelled || !mountRef.current) return;

      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setSize(width, height);
      mountRef.current.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
      camera.position.set(0, 0, 8);

      const group = new THREE.Group();
      const teal = new THREE.Color("#176f6a");
      const taupe = new THREE.Color("#c8a58c");
      const brown = new THREE.Color("#3a251f");

      for (let i = 0; i < 9; i += 1) {
        const radius = 0.9 + i * 0.22;
        const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2, false, 0);
        const points = curve.getPoints(96);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
          color: i % 3 === 0 ? teal : i % 2 === 0 ? taupe : brown,
          transparent: true,
          opacity: 0.18 - i * 0.008,
        });
        const line = new THREE.Line(geometry, material);
        line.rotation.z = i * 0.17;
        group.add(line);
      }

      for (let i = 0; i < 16; i += 1) {
        const geometry = new THREE.PlaneGeometry(0.1, 1.65);
        const material = new THREE.MeshBasicMaterial({
          color: i % 2 ? "#0e625e" : "#5a3a2e",
          transparent: true,
          opacity: 0.08,
          side: THREE.DoubleSide,
        });
        const blade = new THREE.Mesh(geometry, material);
        blade.position.set(Math.cos(i) * 1.9, Math.sin(i) * 1.9, -0.2);
        blade.rotation.z = (Math.PI * 2 * i) / 16;
        group.add(blade);
      }

      scene.add(group);

      const pointer = { x: 0, y: 0 };
      const onPointer = (event: PointerEvent) => {
        const rect = mountRef.current?.getBoundingClientRect();
        if (!rect) return;
        pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * -2;
      };
      window.addEventListener("pointermove", onPointer);

      const onResize = () => {
        if (!mountRef.current) return;
        const nextWidth = mountRef.current.clientWidth;
        const nextHeight = mountRef.current.clientHeight;
        camera.aspect = nextWidth / nextHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(nextWidth, nextHeight);
      };
      window.addEventListener("resize", onResize);

      let frame = 0;
      const animate = () => {
        frame = window.requestAnimationFrame(animate);
        group.rotation.z += 0.0018;
        group.rotation.x += (pointer.y * 0.08 - group.rotation.x) * 0.035;
        group.rotation.y += (pointer.x * 0.08 - group.rotation.y) * 0.035;
        renderer.render(scene, camera);
      };
      animate();

      cleanup = () => {
        window.cancelAnimationFrame(frame);
        window.removeEventListener("pointermove", onPointer);
        window.removeEventListener("resize", onResize);
        renderer.dispose();
        mountRef.current?.replaceChildren();
      };
    }

    setup();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [reducedMotion]);

  return <div ref={mountRef} className="lens-field" aria-hidden="true" />;
}
