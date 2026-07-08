/**
 * Dependency-free reimagining of the Codrops "Elastic SVG Elements" morph
 * (originally Snap.svg + mina.elastic). We interpolate the numeric values of
 * two structurally-identical `<path d>` strings and drive them with an elastic
 * release easing — giving the tactile squish-and-settle on press/release
 * without pulling in Snap.svg.
 */

const NUMBER = /-?\d*\.?\d+(?:e[-+]?\d+)?/gi;
// SVG path data never contains "@", so it is a safe re-insertion slot.
const SLOT = "@";
const SLOT_RE = /@/g;

type Parsed = { template: string; numbers: number[] };

function parsePath(d: string): Parsed {
  const numbers: number[] = [];
  const template = d.replace(NUMBER, (match) => {
    numbers.push(Number.parseFloat(match));
    return SLOT;
  });
  return { template, numbers };
}

function formatNumber(value: number): string {
  // Trim to 3 decimals; drop trailing zeros so the `d` string stays compact.
  return Number.parseFloat(value.toFixed(3)).toString();
}

function buildPath(template: string, numbers: number[]): string {
  let index = 0;
  return template.replace(SLOT_RE, () => formatNumber(numbers[index++] ?? 0));
}

/** Classic elastic-out easing — overshoots then settles. */
export function elasticOut(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const period = 0.36;
  return Math.pow(2, -10 * t) * Math.sin(((t - period / 4) * (2 * Math.PI)) / period) + 1;
}

/** Snappy ease-in for the press-down phase. */
export function easeIn(t: number): number {
  return t * t;
}

type EaseFn = (t: number) => number;

/**
 * Drives an `<path>` element between a rest shape and an active shape.
 * Instantiate inside an effect (client only); call `destroy()` on cleanup.
 * If the two paths are not structurally identical the morph is a no-op, so the
 * element simply keeps its rest shape (graceful, never throws).
 */
export class ElasticMorph {
  private readonly pathEl: SVGPathElement;
  private readonly template: string;
  private readonly rest: number[];
  private readonly active: number[];
  private readonly current: number[];
  private readonly compatible: boolean;

  private from: number[];
  private target: number[];
  private ease: EaseFn = elasticOut;
  private duration = 800;
  private startTime = 0;
  private raf = 0;

  constructor(pathEl: SVGPathElement, restD: string, activeD: string) {
    this.pathEl = pathEl;
    const rest = parsePath(restD);
    const active = parsePath(activeD);
    this.template = rest.template;
    this.rest = rest.numbers;
    this.active = active.numbers;
    this.compatible =
      rest.template === active.template && rest.numbers.length === active.numbers.length;
    this.current = [...rest.numbers];
    this.from = [...rest.numbers];
    this.target = [...rest.numbers];
  }

  press(): void {
    this.animate(this.active, 150, easeIn);
  }

  release(): void {
    this.animate(this.rest, 820, elasticOut);
  }

  private animate(target: number[], duration: number, ease: EaseFn): void {
    if (!this.compatible) return;
    this.from = [...this.current];
    this.target = target;
    this.duration = duration;
    this.ease = ease;
    this.startTime = performance.now();
    if (!this.raf) this.raf = requestAnimationFrame(this.tick);
  }

  private readonly tick = (now: number): void => {
    const elapsed = now - this.startTime;
    const progress = Math.min(1, elapsed / this.duration);
    const eased = this.ease(progress);

    for (let i = 0; i < this.current.length; i += 1) {
      this.current[i] = this.from[i] + (this.target[i] - this.from[i]) * eased;
    }
    this.pathEl.setAttribute("d", buildPath(this.template, this.current));

    if (progress < 1) {
      this.raf = requestAnimationFrame(this.tick);
    } else {
      this.raf = 0;
    }
  };

  destroy(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }
}
