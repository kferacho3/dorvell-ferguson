"use client";

import { cn } from "@/lib/cn";
import type { ElementType, ReactNode } from "react";
import { useInView } from "./useInView";

/**
 * Native scroll-entrance wrapper (opacity + translate via .cw-reveal / .is-in).
 * No animation library; reduced-motion neutralizes it via CSS. `as` lets it be
 * a section/div/li without extra nodes.
 */
export function Reveal({
  children,
  as,
  className,
  style,
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  style?: React.CSSProperties;
}) {
  const Tag = (as ?? "div") as ElementType;
  const { ref, inView } = useInView<HTMLElement>({ rootMargin: "0px 0px -12% 0px", threshold: 0.1, once: true });
  return (
    <Tag ref={ref} className={cn("cw-reveal", inView && "is-in", className)} style={style}>
      {children}
    </Tag>
  );
}
