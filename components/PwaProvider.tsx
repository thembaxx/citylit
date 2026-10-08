"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { workerRequest, type GuideStatus } from "../lib/pwa";
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
type Pwa = {
  online: boolean;
  installed: boolean;
  ios: boolean;
  canPrompt: boolean;
  supported: boolean;
  waiting: boolean;
  reloading: boolean;
  updateError: string;
  reloadReady: boolean;
  guide: GuideStatus;
  registrationError: string;
  install: () => Promise<"accepted" | "dismissed" | "manual">;
  applyUpdate: () => void;
  refreshStatus: () => Promise<void>;
};
const Context = createContext<Pwa | null>(null);
export function usePwa() {
  const value = useContext(Context);
  if (!value) throw new Error("PWA controls need their root provider.");
  return value;
}
export default function PwaProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(true),
    [installed, setInstalled] = useState(false),
    [ios, setIos] = useState(false),
    [supported, setSupported] = useState(false);
  const [canPrompt, setCanPrompt] = useState(false),
    [waiting, setWaiting] = useState(false),
    [reloading, setReloading] = useState(false),
    [reloadReady, setReloadReady] = useState(false),
    [updateError, setUpdateError] = useState("");
  const [guide, setGuide] = useState<GuideStatus>({ textSaved: false, photoCount: 0 }),
    [registrationError, setRegistrationError] = useState("");
  const installEvent = useRef<InstallEvent | null>(null),
    registration = useRef<ServiceWorkerRegistration | null>(null),
    wantsReload = useRef(false),
    updateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshStatus = useCallback(async () => {
    const worker = registration.current?.active;
    if (!worker) return;
    try {
      const status = await workerRequest(worker, "GUIDE_STATUS");
      setGuide(status);
    } catch {
      /* A restarting worker must not block the app. */
    }
  }, []);
  useEffect(() => {
    let disposed = false,
      observedWorker: ServiceWorker | null = null,
      lastCheck = 0;
    const mode = matchMedia("(display-mode: standalone)");
    const detectInstalled = () => {
      const active =
        mode.matches ||
        matchMedia("(display-mode: minimal-ui)").matches ||
        Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
      setInstalled(active);
      document.documentElement.dataset.appMode = active ? "standalone" : "browser";
    };
    detectInstalled();
    mode.addEventListener("change", detectInstalled);
    setIos(
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
    );
    setOnline(navigator.onLine);
    const connected = () => {
      setOnline(navigator.onLine);
      if (navigator.onLine) void refreshStatus();
    };
    window.addEventListener("online", connected);
    window.addEventListener("offline", connected);
    const beforeInstall = (event: Event) => {
      event.preventDefault();
      installEvent.current = event as InstallEvent;
      setCanPrompt(true);
    };
    const didInstall = () => {
      installEvent.current = null;
      setCanPrompt(false);
      setInstalled(true);
    };
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", didInstall);
    const syncTheme = () => {
      const day = document.documentElement.dataset.theme === "day";
      document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
        meta.content = day ? "#f6f3ed" : "#080f20";
        meta.removeAttribute("media");
      });
      document.documentElement.style.colorScheme = day ? "light" : "dark";
    };
    try {
      document.documentElement.dataset.theme =
        localStorage.getItem("citylit-theme") ||
        (matchMedia("(prefers-color-scheme: light)").matches ? "day" : "night");
    } catch {}
    syncTheme();
    const themeObserver = new MutationObserver(syncTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    const internalOfflineClick = (event: MouseEvent) => {
      if (
        navigator.onLine ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
      )
        return;
      const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, location.href);
      if (
        url.origin !== location.origin ||
        (url.pathname === location.pathname && url.search === location.search && url.hash)
      )
        return;
      event.preventDefault();
      event.stopImmediatePropagation();
      location.assign(url.href);
    };
    document.addEventListener("click", internalOfflineClick, true);
    let hadController = Boolean(navigator.serviceWorker?.controller);
    const controllerChanged = () => {
      if (disposed) return;
      if (wantsReload.current) {
        location.reload();
        return;
      }
      if (hadController) setReloadReady(true);
      hadController = true;
      setWaiting(Boolean(registration.current?.waiting));
      void refreshStatus();
    };
    const workerChanged = () => {
      if (!disposed && observedWorker?.state === "installed" && navigator.serviceWorker.controller)
        setWaiting(true);
    };
    const foundUpdate = () => {
      observedWorker?.removeEventListener("statechange", workerChanged);
      observedWorker = registration.current?.installing || null;
      observedWorker?.addEventListener("statechange", workerChanged);
    };
    const checkUpdate = () => {
      if (
        document.visibilityState !== "visible" ||
        !navigator.onLine ||
        Date.now() - lastCheck < 3600000
      )
        return;
      lastCheck = Date.now();
      void registration.current?.update().catch(() => {});
    };
    if (
      "serviceWorker" in navigator &&
      window.isSecureContext &&
      process.env.NODE_ENV === "production"
    ) {
      setSupported(true);
      navigator.serviceWorker.addEventListener("controllerchange", controllerChanged);
      void navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then((value) => {
          if (disposed) return;
          registration.current = value;
          setWaiting(Boolean(value.waiting));
          value.addEventListener("updatefound", foundUpdate);
          if (value.installing) foundUpdate();
          void refreshStatus();
        })
        .catch(() => {
          if (!disposed)
            setRegistrationError(
              "Offline saving is unavailable. Connect and reopen Citylit to try again.",
            );
        });
      document.addEventListener("visibilitychange", checkUpdate);
    } else {
      setRegistrationError(
        process.env.NODE_ENV !== "production"
          ? "Offline installation is available in the production build."
          : "Offline saving needs a secure connection and a browser with service-worker support.",
      );
    }
    return () => {
      disposed = true;
      mode.removeEventListener("change", detectInstalled);
      window.removeEventListener("online", connected);
      window.removeEventListener("offline", connected);
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", didInstall);
      document.removeEventListener("click", internalOfflineClick, true);
      themeObserver.disconnect();
      navigator.serviceWorker?.removeEventListener("controllerchange", controllerChanged);
      registration.current?.removeEventListener("updatefound", foundUpdate);
      observedWorker?.removeEventListener("statechange", workerChanged);
      document.removeEventListener("visibilitychange", checkUpdate);
      if (updateTimer.current) clearTimeout(updateTimer.current);
    };
  }, [refreshStatus]);
  const install = useCallback(async () => {
    const prompt = installEvent.current;
    if (!prompt) return "manual" as const;
    installEvent.current = null;
    setCanPrompt(false);
    try {
      await prompt.prompt();
      return (await prompt.userChoice).outcome;
    } catch {
      return "manual" as const;
    }
  }, []);
  const applyUpdate = useCallback(() => {
    if (!navigator.onLine) {
      setUpdateError("Connect to update. Your downloaded guide is still available.");
      return;
    }
    if (reloadReady) {
      location.reload();
      return;
    }
    const worker = registration.current?.waiting;
    if (!worker) return;
    setReloading(true);
    setUpdateError("");
    wantsReload.current = true;
    updateTimer.current = setTimeout(() => {
      wantsReload.current = false;
      setReloading(false);
      setUpdateError("The update did not finish. Try again when your connection is ready.");
    }, 12000);
    try {
      worker.postMessage({ type: "SKIP_WAITING" });
    } catch {
      wantsReload.current = false;
      setReloading(false);
      if (updateTimer.current) clearTimeout(updateTimer.current);
      setUpdateError("Could not apply the update. Try again.");
    }
  }, [reloadReady]);
  const value = useMemo(
    () => ({
      online,
      installed,
      ios,
      canPrompt,
      supported,
      waiting,
      reloading,
      reloadReady,
      updateError,
      guide,
      registrationError,
      install,
      applyUpdate,
      refreshStatus,
    }),
    [
      online,
      installed,
      ios,
      canPrompt,
      supported,
      waiting,
      reloading,
      reloadReady,
      updateError,
      guide,
      registrationError,
      install,
      applyUpdate,
      refreshStatus,
    ],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
