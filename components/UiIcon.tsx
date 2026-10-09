type IconName =
  | "arrow-up-right"
  | "arrow-left"
  | "arrow-right"
  | "rotate"
  | "heart"
  | "sun"
  | "compass";

/** Local Hugeicons sprite shared with the offline guide; decorative icons keep text labels intact. */
export default function UiIcon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      className="ui-symbol"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      data-ui-icon={name}
    >
      <use href={`/icons/ui.svg#${name}`} />
    </svg>
  );
}
