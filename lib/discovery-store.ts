import { normalizeDiscovery, type Discovery } from "./client-data";

const databaseName = "citylit-state";
const databaseVersion = 1;
const storeName = "documents";
const discoveryKey = "discovery";
let database: Promise<IDBDatabase> | undefined;

function openDatabase() {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("IndexedDB is unavailable"));
  database ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) db.createObjectStore(storeName);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open local database"));
    request.onblocked = () => reject(new Error("Local database upgrade is blocked by another tab"));
  }).catch((error) => {
    database = undefined;
    throw error;
  });
  return database;
}

function legacySnapshot() {
  try {
    const raw = localStorage.getItem("citylit-discovery-v2") || localStorage.getItem("mzansi-saved") || "{}";
    return raw.length <= 200000 ? normalizeDiscovery(JSON.parse(raw)) : normalizeDiscovery(null);
  } catch {
    return normalizeDiscovery(null);
  }
}

/** Read the canonical document, migrating the legacy localStorage snapshot once. */
export async function readDiscoveryDocument(): Promise<Discovery> {
  return mutateDiscovery(() => ({}));
}

/**
 * Apply a read-modify-write inside one IndexedDB readwrite transaction.
 * IndexedDB serializes overlapping readwrite transactions for this object store
 * across tabs and same-origin pages, preventing lost whole-document updates.
 */
export async function mutateDiscovery(
  change: Partial<Discovery> | ((previous: Discovery) => Partial<Discovery>),
): Promise<Discovery> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.get(discoveryKey);
    let next: Discovery | undefined;
    request.onsuccess = () => {
      const previous = request.result ? normalizeDiscovery(request.result) : legacySnapshot();
      const patch = typeof change === "function" ? change(previous) : change;
      next = normalizeDiscovery({ ...previous, ...patch });
      store.put(next, discoveryKey);
    };
    transaction.oncomplete = () => {
      if (!next) {
        reject(new Error("Local data transaction completed without a value"));
        return;
      }
      // Compatibility mirror only; IndexedDB is authoritative.
      try {
        localStorage.setItem("citylit-discovery-v2", JSON.stringify(next));
        localStorage.setItem("mzansi-saved", JSON.stringify(next.saved));
      } catch {
        // The canonical IndexedDB transaction already committed successfully.
      }
      resolve(next);
    };
    transaction.onerror = () => reject(transaction.error || new Error("Could not save local data"));
    transaction.onabort = () => reject(transaction.error || new Error("Local data transaction was aborted"));
  });
}
