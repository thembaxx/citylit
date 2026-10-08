"use client";
import dynamic from "next/dynamic";
import { X, ArrowUpRight } from "lucide-react";
import { useKhwezi } from "./KhweziProvider";
import KhweziMark from "./KhweziMark";
const KhweziView = dynamic(() => import("./KhweziView"), {
  ssr: false,
  loading: () => <KhweziMark pose="welcome" />,
});
export default function KhweziWelcome({ onHelp }: { onHelp: () => void }) {
  const { welcome, dismissWelcome } = useKhwezi();
  if (!welcome) return null;
  return (
    <aside className="khwezi-welcome" aria-label="Meet Khwezi">
      <div className="khwezi-welcome-portrait">
        <KhweziView pose="welcome" />
      </div>
      <div className="khwezi-welcome-copy">
        <strong>Every city has a spark.</strong>
        <p>I’m Khwezi. Let’s find yours.</p>
        <button
          onClick={() => {
            dismissWelcome();
            onHelp();
          }}
        >
          Show me how <ArrowUpRight size={12} />
        </button>
      </div>
      <button
        className="khwezi-dismiss"
        aria-label="Dismiss Khwezi welcome"
        onClick={dismissWelcome}
      >
        <X size={14} />
      </button>
    </aside>
  );
}
