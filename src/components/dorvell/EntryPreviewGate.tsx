import Image from "next/image";
import type { DorvellImage } from "@/content/dorvell.schema";
import { blurImageProps, imageAlt } from "@/lib/images";

export function EntryPreviewGate({ images, totalFrames }: { images: DorvellImage[]; totalFrames: number }) {
  const previewImages = images.slice(0, 4);

  return (
    <section className="entry-gate" aria-labelledby="entry-title">
      <div className="entry-gate__copy">
        <p>Dorvell Ferguson Jr. / Tampa</p>
        <h1 id="entry-title">Enter the archive.</h1>
        <span>{totalFrames} frames across portraits, music, sports, and fashion.</span>
        <a href="#portfolio">Enter</a>
      </div>
      <div className="entry-gate__preview" aria-label="Portfolio preview">
        {previewImages.map((image, index) => (
          <figure key={image.id} className="entry-gate__frame">
            <Image
              src={image.localOptimized.md}
              alt={imageAlt(image)}
              width={image.width}
              height={image.height}
              sizes="(max-width: 760px) 78vw, 25vw"
              unoptimized
              priority={index < 2}
              {...blurImageProps(image)}
            />
            <figcaption>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{image.category}</strong>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
