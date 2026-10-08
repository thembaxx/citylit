import KhweziMark from "./KhweziMark";
import { khweziMoments } from "../lib/brand";
export default function KhweziMoment({
  pose,
  compact = false,
}: {
  pose: keyof typeof khweziMoments;
  compact?: boolean;
}) {
  const copy = khweziMoments[pose];
  return (
    <div className={`khwezi-moment ${compact ? "khwezi-moment-compact" : ""}`}>
      <KhweziMark pose={pose} />
      <div>
        <strong>{copy.title}</strong>
        <p>{copy.text}</p>
      </div>
    </div>
  );
}
