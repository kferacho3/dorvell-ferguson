"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

export function ApertureLoader() {
  const reducedMotion = usePrefersReducedMotion();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (reducedMotion) return;
    const timeout = window.setTimeout(() => setVisible(false), 950);
    return () => window.clearTimeout(timeout);
  }, [reducedMotion]);

  if (reducedMotion || !visible) return null;

  return (
    <div className="aperture-loader" aria-hidden="true">
      <div className="aperture-mark">
        <Image src="/dorvell-ferguson-symbol-v2.png" alt="" width={76} height={76} priority />
        <span />
      </div>
    </div>
  );
}
