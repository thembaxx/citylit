"use client";
import { useState } from "react";
import { BookmarkSimple, Check } from "@phosphor-icons/react";
import { useDiscovery } from "./useDiscovery";
import MagneticButton from "./ui/MagneticButton";
export default function SavePlace({ id, name }: { id: string; name: string }) {
  const { state, update } = useDiscovery();
  const [error, setError] = useState("");
  const saved = state.saved.includes(id);
  return (
    <div className="atlas-save-place">
      <MagneticButton
        className="atlas-button"
        strength={0.14}
        aria-pressed={saved}
        aria-label={`${saved ? "Unsave" : "Save"} ${name}`}
        onClick={() => {
          const ok = update((previous) => ({
            saved: saved ? previous.saved.filter((value) => value !== id) : [...previous.saved, id],
          }));
          setError(ok ? "" : "Unable to save. Allow site storage and try again.");
        }}
      >
        {saved ? <Check size={18} /> : <BookmarkSimple size={18} />}
        {saved ? "Saved discovery" : "Save this discovery"}
      </MagneticButton>
      {error && <p role="status">{error}</p>}
    </div>
  );
}
