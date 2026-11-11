"use client";
import { useEffect } from "react";
import { Sun } from "@phosphor-icons/react";
import useTheme from "./useTheme";

export default function ThemeToggle({
  onChange,
  onOpenSettings,
}: {
  onChange?: (night: boolean) => void;
  onOpenSettings?: () => void;
}) {
  const { night, toggleTheme } = useTheme();
  useEffect(() => {
    onChange?.(night);
  }, [night, onChange]);

  const handleClick = () => {
    toggleTheme();
    onOpenSettings?.();
  };

  return (
    <button
      className="icon-button citylit-header-theme-btn"
      aria-label={night ? "Switch to day theme" : "Switch to night theme"}
      title="Settings & Theme"
      onClick={handleClick}
    >
      <Sun size={20} weight={night ? "regular" : "fill"} />
    </button>
  );
}
