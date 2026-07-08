import { useEffect, useRef, type RefObject } from "react";

/**
 * A contained, threshold-gated cursor image-trail (MotionTrail technique).
 * Spawns recycled image nodes inside `containerRef` as the pointer moves, but
 * ONLY on fine-pointer devices and when `enabled` is true (callers pass
 * `mode !== "calm" && !reducedMotion`). Spawn frequency is spatial, not temporal
 * — fast cursor = denser trail, still cursor = nothing. A fixed pool of nodes is
 * recycled circularly (no createElement per spawn) and fully removed on cleanup.
 *
 * Purely imperative (refs + listeners in effects, no render-time ref reads, no
 * setState) so it satisfies the repo's strict react-compiler lint.
 */
export function useHoverTrail(
  containerRef: RefObject<HTMLElement | null>,
  options: { images: string[]; enabled: boolean; poolSize?: number; threshold?: number },
) {
  const { images, enabled, poolSize = 6, threshold = 92 } = options;
  const imagesRef = useRef<string[]>(images);

  // Keep the latest images available to the spawn loop without re-binding listeners.
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled || typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const nodes: HTMLSpanElement[] = [];
    for (let i = 0; i < poolSize; i += 1) {
      const node = document.createElement("span");
      node.className = "pf-trail-img";
      node.setAttribute("aria-hidden", "true");
      container.appendChild(node);
      nodes.push(node);
    }

    let last = { x: 0, y: 0 };
    let started = false;
    let poolIndex = 0;
    let zIndex = 1;

    const spawn = (x: number, y: number) => {
      const pool = imagesRef.current;
      if (pool.length === 0) return;
      const node = nodes[poolIndex];
      const src = pool[poolIndex % pool.length];
      poolIndex = (poolIndex + 1) % nodes.length;
      zIndex += 1;
      node.style.backgroundImage = `url("${src}")`;
      node.style.left = `${x}px`;
      node.style.top = `${y}px`;
      node.style.zIndex = String(zIndex);
      node.classList.remove("is-live");
      // force reflow so the animation restarts on a recycled node
      void node.offsetWidth;
      node.classList.add("is-live");
    };

    const onMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (!started) {
        started = true;
        last = { x, y };
        return;
      }
      const distance = Math.hypot(x - last.x, y - last.y);
      if (distance > threshold) {
        spawn(x, y);
        last = { x, y };
      }
    };

    const onLeave = () => {
      started = false;
    };

    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerleave", onLeave);
    return () => {
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
      for (const node of nodes) node.remove();
    };
  }, [containerRef, enabled, poolSize, threshold]);
}
