import type { CSSProperties } from "react";

export function SlicedTitle({ id, text }: { id?: string; text: string }) {
  return (
    <h1 className="sliced-title" id={id} aria-label={text}>
      <span className="sr-only">{text}</span>
      <span className="sliced-title__depth" aria-hidden="true">
        {Array.from({ length: 9 }).map((_, index) => (
          <span
            className="sliced-title__depth-layer"
            data-text={text}
            key={index}
            style={{ "--depth": index } as CSSProperties}
          />
        ))}
      </span>
      {Array.from({ length: 6 }).map((_, index) => (
        <span
          aria-hidden="true"
          className="sliced-title__row"
          data-text={text}
          key={index}
          style={{ "--slice": index } as CSSProperties}
        />
      ))}
      <span className="sliced-title__shine" aria-hidden="true" />
    </h1>
  );
}
