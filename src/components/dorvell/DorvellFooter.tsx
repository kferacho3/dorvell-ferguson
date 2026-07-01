import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { buildGalleryLanes } from "@/lib/gallery-lanes";
import { getPortfolioData } from "@/lib/portfolio-data";

export function DorvellFooter() {
  const { generated, manual } = getPortfolioData();
  const lanes = buildGalleryLanes(generated.images);
  const closingReel = lanes.flatMap((lane) =>
    lane.images.slice(0, 3).map((image) => ({
      image,
      lane,
    })),
  );

  return (
    <footer className="site-footer" id="closing-frame" data-studio-section="closing">
      <div className="footer-mark">
        <Image src="/dorvell-ferguson-symbol-v2.png" alt="" width={56} height={56} />
        <div>
          <p className="eyebrow">DF Archive</p>
          <h2>Fashion, music, movement, and the exact second it becomes a frame.</h2>
        </div>
      </div>

      <div className="footer-reel" aria-label="Closing portfolio reel">
        {closingReel.concat(closingReel.slice(0, 6)).map(({ image, lane }, index) => (
          <Link
            href={`/#${lane.slug}`}
            key={`${image.id}-${index}`}
            style={{ "--lane-accent": lane.accent } as CSSProperties}
          >
            <Image src={image.localOptimized.sm} alt="" width={image.width} height={image.height} />
            <span>{lane.label}</span>
          </Link>
        ))}
      </div>

      <div className="footer-signal-board" aria-label="Closing contact board">
        <div>
          <p className="eyebrow">Next Frame</p>
          <strong>Brief in. Plan tight. Images with somewhere to go.</strong>
        </div>
        <div className="footer-signal-board__stats">
          <span>
            <em>{generated.images.length}</em>
            catalogued frames
          </span>
          <span>
            <em>{lanes.length}</em>
            live lanes
          </span>
          <span>
            <em>Tampa</em>
            travel by inquiry
          </span>
        </div>
        <a href={`mailto:${manual.profile.email}?subject=${encodeURIComponent("Dorvell Ferguson Jr. booking inquiry")}`}>
          Send the brief
        </a>
      </div>

      <nav className="footer-lanes" aria-label="Gallery lanes">
        {lanes.map((lane, index) => (
          <Link key={lane.key} href={`/#${lane.slug}`} style={{ "--lane-accent": lane.accent } as CSSProperties}>
            {lane.images[0] ? (
              <Image
                src={lane.images[0].localOptimized.sm}
                alt=""
                width={lane.images[0].width}
                height={lane.images[0].height}
              />
            ) : null}
            <em>{String(index + 1).padStart(2, "0")}</em>
            <span>{lane.eyebrow}</span>
            <strong>{lane.label}</strong>
          </Link>
        ))}
      </nav>
      <div className="footer-grid">
        <div>
          <p>{manual.profile.shortBio}</p>
          <a href={`mailto:${manual.profile.email}`}>{manual.profile.email}</a>
        </div>
        <nav aria-label="Footer">
          <Link href="/work">Work</Link>
          <Link href="/runway">Runway</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <div>
          <span>{generated.images.length} portfolio frames catalogued</span>
          <span>Tampa, Florida</span>
          <a href={`mailto:${manual.profile.email}?subject=${encodeURIComponent("Dorvell Ferguson Jr. booking inquiry")}`}>
            Send the brief
          </a>
          <a href="https://www.instagram.com/2kferg/">@2kferg</a>
          <a href="https://www.instagram.com/fergphotography/">@fergphotography</a>
        </div>
      </div>
    </footer>
  );
}
