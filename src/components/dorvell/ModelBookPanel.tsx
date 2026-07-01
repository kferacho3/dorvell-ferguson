import type { DorvellManual } from "@/content/dorvell.manual";

export function ModelBookPanel({ manual }: { manual: DorvellManual }) {
  return (
    <section className="model-book" aria-labelledby="model-book-title">
      <div>
        <p className="eyebrow">Model Card</p>
        <h2 id="model-book-title">Pose, lens, light, and timing in the same body.</h2>
        <p>
          A fashion-facing lane for runway, editorial, and campaign environments where Dorvell can read the camera from both sides.
        </p>
      </div>
      <dl>
        <div>
          <dt>Creative lane</dt>
          <dd>Runway / editorial / fashion content</dd>
        </div>
        <div>
          <dt>Perspective</dt>
          <dd>Photographer-level awareness of light, angle, pose, and framing</dd>
        </div>
        <div>
          <dt>Development</dt>
          <dd>The Mixson Method</dd>
        </div>
      </dl>
      <ul>
        <li>Stats available on request</li>
        <li>Runway / editorial availability</li>
        <li>{manual.profile.location}-based, travel-ready by inquiry</li>
      </ul>
    </section>
  );
}
