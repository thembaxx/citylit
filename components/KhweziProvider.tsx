"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useDiscovery } from "./useDiscovery";
import { useDelight } from "./useDelight";
import KhweziMark from "./KhweziMark";
import { khweziMoments, type KhweziPose } from "../lib/brand";

type Moment = { id: number; pose: KhweziPose; title: string; text: string; accent: string };
type Guide = ReturnType<typeof useDelight> & {
  moving: boolean;
  animations: boolean;
  toggleAnimations: () => void;
  welcome: boolean;
  dismissWelcome: () => void;
  celebrate: (pose: "saved" | "offline", text?: string) => void;
};
const Context = createContext<Guide | null>(null);
export function useKhwezi() {
  const guide = useContext(Context);
  if (!guide) throw new Error("Khwezi needs the root guide provider.");
  return guide;
}
export default function KhweziProvider({ children }: { children: ReactNode }) {
  const delight = useDelight();
  const { state } = useDiscovery();
  const reduced = useReducedMotion();
  const [animations, setAnimations] = useState(true);
  const [welcome, setWelcome] = useState(false);
  const [moment, setMoment] = useState<Moment | null>(null);
  const moving = animations && !state.essential && !reduced;
  const toggleAnimations = useCallback(() => setAnimations((value) => !value), []);
  useEffect(() => {
    try {
      setWelcome(localStorage.getItem("citylit-khwezi-met") !== "yes");
    } catch {
      setWelcome(true);
    }
  }, []);
  const dismissWelcome = useCallback(() => {
    setWelcome(false);
    try {
      localStorage.setItem("citylit-khwezi-met", "yes");
    } catch {}
  }, []);
  const celebrate = useCallback((pose: "saved" | "offline", text?: string) => {
    if (document.visibilityState !== "visible") return;
    const copy = khweziMoments[pose];
    const screen = document.querySelector(".game-screen, .field-guide");
    const accent = screen ? getComputedStyle(screen).getPropertyValue("--city-color").trim() : "";
    setMoment({
      id: performance.now(),
      pose,
      title: copy.title,
      text: text || copy.text,
      accent: accent || "#6558F5",
    });
  }, []);
  useEffect(() => {
    const saved = () => {
      delight.feedback("save");
      celebrate("saved");
    };
    window.addEventListener("citylit:spark-saved", saved);
    return () => window.removeEventListener("citylit:spark-saved", saved);
  }, [delight.feedback, celebrate]);
  useEffect(() => {
    const offline = () =>
      celebrate(
        "offline",
        "The signal wandered off. Open your downloaded guide to keep exploring.",
      );
    window.addEventListener("offline", offline);
    return () => window.removeEventListener("offline", offline);
  }, [celebrate]);
  useEffect(() => {
    if (!moment) return;
    const timer = window.setTimeout(() => setMoment(null), 3600);
    return () => clearTimeout(timer);
  }, [moment]);
  const value = useMemo(
    () => ({
      ...delight,
      moving,
      animations,
      toggleAnimations,
      welcome,
      dismissWelcome,
      celebrate,
    }),
    [delight, moving, animations, toggleAnimations, welcome, dismissWelcome, celebrate],
  );
  return (
    <Context.Provider value={value}>
      <div className="brand-world" data-khwezi-motion={moving ? "play" : "still"}>
        {children}
        <AnimatePresence>
          {moment && (
            <motion.aside
              key={moment.id}
              className="khwezi-toast"
              role="status"
              aria-live="polite"
              style={{ "--khwezi-spark": moment.accent } as CSSProperties}
              initial={{ opacity: 0, y: moving ? 12 : 0 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: moving ? 0.25 : 0 }}
            >
              <KhweziMark pose={moment.pose} />
              <div>
                <strong>{moment.title}</strong>
                <p>{moment.text}</p>
                {moment.pose === "offline" && <a href="/offline.html">Open offline guide ↗</a>}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </Context.Provider>
  );
}
