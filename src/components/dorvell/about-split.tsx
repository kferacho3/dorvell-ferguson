import { Fragment, type CSSProperties } from "react";

/**
 * Splits text into per-character spans for blur/bend animations, but groups
 * each word inside an inline-block `.about-char-word` (white-space:nowrap) so
 * words never break mid-word when the headline wraps — only the (breakable)
 * spaces between words wrap. Character indices are computed purely from word
 * lengths (no mutable counter — react-compiler safe) and are deterministic, so
 * SSR and client markup match. The visible spans are aria-hidden; give the
 * parent an aria-label for the accessible name (SlicedTitle idiom).
 */
export function CharWords({
  text,
  charClass = "about-char",
  extra,
}: {
  text: string;
  charClass?: string;
  extra?: (index: number, total: number) => Record<string, string | number>;
}) {
  const total = Array.from(text).length;
  const words = text.split(" ");
  const lengths = words.map((word) => Array.from(word).length);
  // Global start index of each word (+1 per interleaving space).
  const starts = lengths.map((_, i) => lengths.slice(0, i).reduce((sum, length) => sum + length + 1, 0));

  return (
    <span aria-hidden="true">
      {words.map((word, wordIndex) => (
        <Fragment key={wordIndex}>
          <span className="about-char-word">
            {Array.from(word).map((char, charIndex) => {
              const index = starts[wordIndex] + charIndex;
              const style = { "--ci": index, ...(extra ? extra(index, total) : {}) } as CSSProperties;
              return (
                <span className={charClass} key={charIndex} style={style}>
                  {char}
                </span>
              );
            })}
          </span>
          {wordIndex < words.length - 1 ? " " : ""}
        </Fragment>
      ))}
    </span>
  );
}
