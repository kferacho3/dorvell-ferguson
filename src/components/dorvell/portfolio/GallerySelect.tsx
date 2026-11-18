type GalleryOption<Value extends string> = {
  value: Value;
  label: string;
};

type GallerySelectProps<Value extends string> = {
  id?: string;
  label: string;
  value: Value;
  options: readonly GalleryOption<Value>[];
  onChange: (value: Value) => void;
};

export const galleryDisclosureSummary =
  "flex min-h-11 w-fit cursor-pointer list-none items-center gap-2 rounded-md border border-[var(--df-line)] px-3 text-sm font-semibold text-[var(--df-text)] hover:border-[var(--df-line-strong)] [&::-webkit-details-marker]:hidden";

export function GallerySelect<Value extends string>({
  id,
  label,
  value,
  options,
  onChange,
}: GallerySelectProps<Value>) {
  return (
    <label className="grid min-w-0 gap-1 text-xs font-semibold text-[var(--df-text-soft)]">
      {label}
      <select
        id={id}
        value={value}
        className="min-h-11 w-full min-w-0 rounded-md border border-[var(--df-line)] bg-[var(--df-bg-2)] px-2.5 text-base text-[var(--df-text)] hover:border-[var(--df-line-strong)] sm:text-sm"
        onChange={(event) => {
          const option = options.find(
            ({ value }) => value === event.target.value,
          );
          if (option) onChange(option.value);
        }}
      >
        {options.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
