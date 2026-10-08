"use client";
import { useState } from "react";
import { Check, Download, RefreshCw, Share2, Smartphone, HardDrive, Trash2 } from "lucide-react";
import { usePwa } from "./PwaProvider";
import { useDiscovery } from "./useDiscovery";
import { useKhwezi } from "./KhweziProvider";
import { readyWorker, workerRequest } from "../lib/pwa";
export default function PwaPanel() {
  const pwa = usePwa(),
    { state } = useDiscovery(),
    { feedback } = useKhwezi();
  const [instructions, setInstructions] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const task = async (kind: "SAVE_GUIDE" | "CLEAR_PHOTOS") => {
    setBusy(true);
    setMessage(
      kind === "SAVE_GUIDE"
        ? "Packing your saved places and day photos…"
        : "Removing downloaded photos…",
    );
    try {
      const response = await workerRequest(
        await readyWorker(),
        kind,
        Array.from(new Set([...state.saved, ...state.itinerary])),
      );
      await pwa.refreshStatus();
      setMessage(
        response.ok
          ? kind === "SAVE_GUIDE"
            ? "Your pocket guide is ready to travel."
            : "Downloaded photos removed. Your saves and guide text are kept."
          : response.textSaved
            ? "Text is ready. Some photos could not be downloaded."
            : "Connect and try downloading again.",
      );
      if (response.ok) feedback("save");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not prepare your guide.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="pwa-panel" aria-label="Citylit app and offline settings">
      <div className="pwa-panel-heading">
        <img src="/brand/app-icon-192.png" alt="" width={48} height={48} />
        <div>
          <strong>Citylit, in your pocket.</strong>
          <span>
            {pwa.installed
              ? "Installed · ready for a little curiosity"
              : "Your own home-screen adventure"}
          </span>
        </div>
      </div>
      {!pwa.installed ? (
        <button
          className="pwa-primary"
          disabled={busy}
          onClick={async () => {
            feedback("tap");
            const result = await pwa.install();
            setInstructions(result === "manual");
            if (result === "accepted")
              setMessage("Follow your browser’s install steps. Your saves stay on this device.");
            if (result === "dismissed")
              setMessage("Maybe later. You can install from here any time.");
          }}
        >
          <Smartphone size={18} />
          {pwa.ios ? "Add to Home Screen" : "Install Citylit"}
        </button>
      ) : (
        <p className="pwa-installed">
          <Check size={16} />
          Home-screen app installed
        </p>
      )}
      {instructions && (
        <div className="pwa-install-help">
          <Share2 size={18} />
          <p>
            {pwa.ios
              ? "In Safari, open Share, choose Add to Home Screen, then Add. If you’re inside another app, open this page in Safari first."
              : "Open your browser’s menu and choose Install Citylit or Install app. If installation isn’t offered, use an up-to-date Chrome, Edge or Safari browser."}
          </p>
        </div>
      )}
      <p className="pwa-guide-status">
        {pwa.registrationError ||
          (pwa.waiting || pwa.reloadReady
            ? "Update Citylit to use the latest offline controls."
            : pwa.guide.textSaved
              ? `Offline text ready · ${pwa.guide.photoCount} downloaded photos`
              : "Preparing your offline pocket guide…")}
      </p>
      <p className="pwa-note">
        Descriptions and addresses travel with you. Download up to 30 saved or planned places’
        photos. Live 3D, street maps and ticket pages need a connection.
      </p>
      <div className="pwa-actions">
        <button
          disabled={busy || !pwa.supported || !pwa.online || pwa.waiting || pwa.reloadReady}
          onClick={() => void task("SAVE_GUIDE")}
        >
          <Download size={16} />
          {busy ? "Working…" : "Download photos"}
        </button>
        <a href="/offline.html">Open pocket guide ↗</a>
      </div>
      {(pwa.waiting || pwa.reloadReady) && (
        <button
          className="pwa-primary"
          disabled={pwa.reloading || !pwa.online}
          onClick={pwa.applyUpdate}
        >
          <RefreshCw size={17} />
          {pwa.reloading ? "Updating…" : "Update Citylit"}
        </button>
      )}
      <div className="pwa-storage-actions">
        <button
          onClick={async () => {
            try {
              const granted = await navigator.storage?.persist?.();
              setMessage(
                granted
                  ? "Storage persistence granted by your browser."
                  : "Your browser manages storage automatically. Downloads can be prepared again here.",
              );
            } catch {
              setMessage("Your browser manages storage automatically.");
            }
          }}
        >
          <HardDrive size={14} />
          Keep downloads
        </button>
        <button
          disabled={busy || !pwa.guide.photoCount || pwa.waiting || pwa.reloadReady}
          onClick={() => void task("CLEAR_PHOTOS")}
        >
          <Trash2 size={14} />
          Remove photos
        </button>
      </div>
      <p className="pwa-message" role="status">
        {message || pwa.updateError}
      </p>
    </section>
  );
}
