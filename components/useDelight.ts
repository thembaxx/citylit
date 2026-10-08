"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
type Feedback = "tap" | "swipe" | "save";
export function useDelight() {
  const [sound, setSound] = useState(false);
  const [haptics, setHaptics] = useState(true);
  const audio = useRef<AudioContext | null>(null);
  const last = useRef(0);
  useEffect(() => {
    // Sound is deliberately session-only: a reload never starts audible feedback.
    try {
      setHaptics(localStorage.getItem("citylit-haptics") !== "off");
    } catch {}
    return () => {
      void audio.current?.close();
    };
  }, []);
  const feedback = useCallback(
    (kind: Feedback = "tap", audible = sound) => {
      if (document.visibilityState !== "visible") return;
      const now = performance.now();
      if (now - last.current < 75) return;
      last.current = now;
      if (haptics && typeof navigator.vibrate === "function") {
        try {
          navigator.vibrate(kind === "save" ? [12, 30, 18] : kind === "swipe" ? 8 : 12);
        } catch {}
      }
      if (!audible) return;
      try {
        const Audio =
          window.AudioContext ||
          (window as typeof window & { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!Audio) return;
        const ctx = audio.current ?? (audio.current = new Audio());
        const play = () => {
          if (ctx.state !== "running") return;
          const start = ctx.currentTime;
          const notes =
            kind === "save" ? [523.25, 783.99] : kind === "swipe" ? [392, 523.25] : [523.25];
          notes.forEach((frequency, i) => {
            const oscillator = ctx.createOscillator(),
              gain = ctx.createGain();
            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(frequency, start + i * 0.045);
            gain.gain.setValueAtTime(0, start + i * 0.045);
            gain.gain.linearRampToValueAtTime(0.025, start + i * 0.045 + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + i * 0.045 + 0.16);
            oscillator.connect(gain);
            gain.connect(ctx.destination);
            oscillator.start(start + i * 0.045);
            oscillator.stop(start + i * 0.045 + 0.18);
            oscillator.onended = () => {
              oscillator.disconnect();
              gain.disconnect();
            };
          });
        };
        if (ctx.state === "suspended")
          void ctx
            .resume()
            .then(play)
            .catch(() => {});
        else play();
      } catch {
        /* Unsupported or denied browser APIs must never interrupt an action. */
      }
    },
    [sound, haptics],
  );
  const toggleSound = useCallback(() => {
    setSound(!sound);
    if (!sound) feedback("save", true);
  }, [sound, feedback]);
  const toggleHaptics = useCallback(() => {
    setHaptics(!haptics);
    try {
      localStorage.setItem("citylit-haptics", haptics ? "off" : "on");
    } catch {}
  }, [haptics]);
  return useMemo(
    () => ({ sound, haptics, feedback, toggleSound, toggleHaptics }),
    [sound, haptics, feedback, toggleSound, toggleHaptics],
  );
}
