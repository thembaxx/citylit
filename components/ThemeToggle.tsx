"use client";
import { useEffect } from "react";
import { GearSix, Sun } from "@phosphor-icons/react";
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

  // With settings available the control opens the sheet; the theme itself is
  // chosen there, so opening settings never changes the theme by surprise.
  const handleClick = () => {
    if (onOpenSettings) {
      onOpenSettings();
      return;
    }
    toggleTheme();
  };

  return (
    <button
      className="icon-button citylit-header-theme-btn"
      aria-label={
        onOpenSettings ? "Open settings" : night ? "Switch to day theme" : "Switch to night theme"
      }
      title={onOpenSettings ? "Settings" : "Theme"}
      onClick={handleClick}
    >
      {onOpenSettings ? (
        <GearSix size={20} weight="regular" />
      ) : (
        <Sun size={20} weight={night ? "regular" : "fill"} />
      )}
    </button>
  );
}
