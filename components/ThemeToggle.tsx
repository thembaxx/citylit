"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
export default function ThemeToggle({ onChange }: { onChange?: (night: boolean) => void }) {
  const [night, setNight] = useState(true);
  useEffect(() => {
    const selected = document.documentElement.dataset.theme !== "day";
    setNight(selected);
    onChange?.(selected);
  }, [onChange]);
  return (
    <button
      className="icon-button"
      aria-label={night ? "Switch to day theme" : "Switch to night theme"}
      onClick={() => {
        const next = !night;
        setNight(next);
        onChange?.(next);
        document.documentElement.dataset.theme = next ? "night" : "day";
        try {
          localStorage.setItem("citylit-theme", next ? "night" : "day");
        } catch {}
      }}
    >
      {night ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
