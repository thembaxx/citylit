export type GuideStatus = { textSaved: boolean; photoCount: number };
export function workerRequest(
  worker: ServiceWorker,
  type: "SAVE_GUIDE" | "GUIDE_STATUS" | "CLEAR_PHOTOS",
  ids: string[] = [],
): Promise<GuideStatus & { ok: boolean }> {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const timeout = window.setTimeout(
      () => {
        channel.port1.close();
        reject(new Error("The offline guide did not respond. Try again."));
      },
      type === "SAVE_GUIDE" ? 45000 : 5000,
    );
    channel.port1.onmessage = ({ data }) => {
      clearTimeout(timeout);
      channel.port1.close();
      if (typeof data?.textSaved !== "boolean" || typeof data?.ok !== "boolean") {
        reject(new Error("Invalid guide response"));
        return;
      }
      resolve({
        ok: data.ok,
        textSaved: data.textSaved,
        photoCount:
          Number.isSafeInteger(data.photoCount) && data.photoCount >= 0 ? data.photoCount : 0,
      });
    };
    try {
      worker.postMessage({ type, ids: ids.slice(0, 30) }, [channel.port2]);
    } catch (error) {
      clearTimeout(timeout);
      channel.port1.close();
      reject(error);
    }
  });
}
export async function readyWorker() {
  if (!("serviceWorker" in navigator))
    throw new Error("Offline guides need a secure browser with service workers.");
  const registration = await new Promise<ServiceWorkerRegistration>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Connect once to prepare your pocket guide.")),
      5000,
    );
    navigator.serviceWorker.ready.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
  if (!registration.active)
    throw new Error("Your guide is still getting ready. Try again shortly.");
  return registration.active;
}
