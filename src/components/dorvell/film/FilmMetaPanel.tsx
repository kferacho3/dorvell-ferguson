import {
  formatRuntime,
  orientationLabel,
  type CreativeItem,
} from "@/content/creative";

const TYPE_LABELS: Record<string, string> = {
  short: "Cinematic short",
  "motion-study": "Motion study",
  video: "Video",
  photoshoot: "Photoshoot",
  concept: "Concept",
  bts: "Behind the scenes",
  photo: "Photo",
};

/**
 * The editorial spine beside a film: what it is, how it was made, and who did
 * what. Rendered identically in the viewer and on the film route so the two can
 * never disagree — every value is derived from the film record, none retyped.
 */
export function FilmMetaPanel({ film }: { film: CreativeItem }) {
  const specs: { label: string; value: string }[] = [
    { label: "Type", value: TYPE_LABELS[film.type] ?? film.type },
    { label: "Runtime", value: formatRuntime(film.duration) },
    { label: "Format", value: orientationLabel(film.orientation) },
    { label: "Mood", value: film.moods.map((m) => m[0].toUpperCase() + m.slice(1)).join(" · ") },
  ];
  if (film.visualLanguage) specs.push({ label: "Visual language", value: film.visualLanguage });
  if (film.location) specs.push({ label: "Location", value: film.location });
  if (film.roles?.length) specs.push({ label: "Roles", value: film.roles.join(" · ") });

  return (
    <dl className="fv-specs">
      {specs.map((spec) => (
        <div key={spec.label} className="fv-specs__row">
          <dt>{spec.label}</dt>
          <dd>{spec.value}</dd>
        </div>
      ))}
    </dl>
  );
}
