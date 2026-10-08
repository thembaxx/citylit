"use client";
import { useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import useTheme from "./useTheme";
export default function ThemeToggle({ onChange }: { onChange?: (night: boolean) => void }) {
  const { night, toggleTheme } = useTheme();
  useEffect(() => {
    onChange?.(night);
  }, [night, onChange]);
  return (
    <button
      className="icon-button"
      aria-label={night ? "Switch to day theme" : "Switch to night theme"}
      onClick={toggleTheme}
    >
      {night ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
