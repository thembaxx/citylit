import { pathToFileURL } from "node:url";

const origin = "https://citylit.vercel.app";
const maxBytes = 2 * 1024 * 1024;

/** Read-only checks against the public production alias. No credentials or visitor data. */
export async function checkProduction(request = fetch) {
  const checked = [];
  async function get(path, contentType, status = 200) {
    const url = new URL(path, origin);
    if (url.origin !== origin) throw new Error("Check escaped the production origin.");
    const response = await request(url, {
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
      headers: { "user-agent": "Citylit-uptime/1.0" },
    });
    if (response.status !== status)
      throw new Error(`${path}: expected ${status}, got ${response.status}`);
    if (!response.headers.get("content-type")?.includes(contentType)) {
      throw new Error(`${path}: unexpected content type`);
    }
    const reader = response.body?.getReader();
    if (!reader) throw new Error(`${path}: empty response`);
    const chunks = [];
    let size = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > maxBytes) throw new Error(`${path}: response exceeds check budget`);
        chunks.push(value);
      }
    } finally {
      await reader.cancel();
    }
    checked.push(path);
    return new TextDecoder().decode(Buffer.concat(chunks));
  }
  const health = JSON.parse(await get("/api/health", "application/json"));
  if (health.status !== "ok" || !/^[a-f0-9]{40}$/.test(health.revision || "")) {
    throw new Error("Production health or build revision is invalid.");
  }
  const home = await get("/", "text/html");
  if (!/Discover(?:\s|<[^>]*>)*South Africa/i.test(home))
    throw new Error("Discovery page is missing.");
  const asset = home.match(/<script[^>]+src="(\/_next\/static\/[^"\s]+\.js[^"\s]*)"/);
  if (!asset) throw new Error("Application bootstrap asset is missing.");
  if (!(await get(asset[1].replaceAll("&amp;", "&"), "javascript")).trim()) {
    throw new Error("Application bootstrap asset is empty.");
  }
  const catalog = JSON.parse(await get("/data/places.json", "application/json"));
  if (!Array.isArray(catalog)) throw new Error("Production catalog is not an array.");
  const cities = new Set(catalog.map((place) => place.city));
  if (catalog.length < 80 || cities.size !== 12) {
    throw new Error("Production catalog coverage is incomplete.");
  }
  if (!/Table Mountain/.test(await get("/cape-town/parks-zoos/table-mountain", "text/html"))) {
    throw new Error("Representative place page is missing.");
  }
  if (!/Table Mountain/.test(await get("/cape-town/landmarks", "text/html")))
    throw new Error("Interactive landmark stage is missing.");
  const models = JSON.parse(await get("/models/stage/manifest.json", "application/json"));
  if (
    !Array.isArray(models) ||
    models.length < 15 ||
    !models.every(
      (model) => /^\/models\/stage\/[a-z-]+\.glb$/.test(model.src) && model.bytes < 150 * 1024,
    )
  )
    throw new Error("Model manifest is invalid.");
  if (!(await get(models[0].src, "model/gltf-binary")).startsWith("glTF"))
    throw new Error("Model asset is invalid.");
  if (!(await get("/draco/draco_decoder.wasm", "application/wasm")).startsWith("\0asm"))
    throw new Error("Model decoder is invalid.");
  const manifest = JSON.parse(await get("/manifest.webmanifest", "application/manifest+json"));
  if (!/citylit/i.test(manifest.name || "") || !manifest.start_url)
    throw new Error("Install manifest is invalid.");
  await get("/not-a-city", "text/html", 404);
  const latest = JSON.parse(await get("/api/health", "application/json"));
  if (latest.status !== "ok" || latest.revision !== health.revision) {
    throw new Error("Production changed during checks; retry against one release.");
  }
  return { origin, revision: health.revision, checked };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let result;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      result = await checkProduction();
      break;
    } catch (error) {
      console.error(`Production check ${attempt}/3: ${error.message}`);
      if (attempt === 3) process.exitCode = 1;
      else await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
  if (result) console.log(JSON.stringify(result, null, 2));
}
