"use client";
import UiIcon from "./UiIcon";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { RefreshCw, X, WifiOff } from "lucide-react";
import { usePwa } from "./PwaProvider";
export default function AppStatus() {
  const pwa = usePwa(),
    reduced = useReducedMotion(),
    [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    setDismissed(false);
  }, [pwa.waiting, pwa.reloadReady, pwa.online]);
  const visible = !dismissed && (!pwa.online || pwa.waiting || pwa.reloadReady);
  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          className="pwa-status"
          aria-label="App status"
          initial={{ opacity: 0, y: reduced ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.2 }}
        >
          {!pwa.online ? (
            <>
              <WifiOff size={18} />
              <div>
                <strong>Keep a little curiosity.</strong>
                <p role="status">
                  {pwa.guide.textSaved
                    ? "Offline · your pocket guide is ready"
                    : "Offline · connect once to prepare your guide"}
                </p>
                <a href="/offline.html">
                  Open pocket guide <UiIcon name="arrow-up-right" />
                </a>
              </div>
            </>
          ) : (
            <>
              <RefreshCw size={18} />
              <div>
                <strong>A new chapter is ready.</strong>
                <p role="status">
                  {pwa.updateError || "Finish any draft, then reload. Your saves stay."}
                </p>
                <button disabled={pwa.reloading} onClick={pwa.applyUpdate}>
                  {pwa.reloading ? "Updating…" : "Update now"}
                </button>
              </div>
            </>
          )}
          <button
            className="pwa-status-close"
            aria-label="Dismiss app status"
            onClick={() => setDismissed(true)}
          >
            <X size={17} />
          </button>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
