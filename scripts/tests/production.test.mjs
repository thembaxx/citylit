import test from "node:test";
import assert from "node:assert/strict";
import { checkProduction } from "../check-production.mjs";

const revision = "a".repeat(40);
function fixture(overrides = {}) {
  const pages = {
    "/api/health": [{ status: "ok", revision }, "application/json"],
    "/": [
      '<h1>Discover<span>South Africa.</span></h1><script src="/_next/static/app.js"></script>',
      "text/html",
    ],
    "/_next/static/app.js": ["window.appLoaded=true", "application/javascript"],
    "/data/places.json": [
      Array.from({ length: 89 }, (_, i) => ({ city: `city-${i % 12}` })),
      "application/json",
    ],
    "/cape-town/parks-zoos/table-mountain": ["<h1>Table Mountain.</h1>", "text/html"],
    "/cape-town/landmarks": ["<h2>Table Mountain</h2>", "text/html"],
    "/models/stage/manifest.json": [
      Array.from({ length: 15 }, (_, i) => ({
        src: i === 1 ? "/models/stage/dome.glb" : "/models/stage/table-mountain.glb",
        bytes: i === 1 ? 4_101_264 : 2_462_112,
      })),
      "application/json",
    ],
    "/models/stage/table-mountain.glb": ["glTF-model", "model/gltf-binary"],
    "/models/stage/dome.glb": ["glTF-big-model", "model/gltf-binary"],
    "/draco/draco_decoder.wasm": ["\0asm-decoder", "application/wasm"],
    "/manifest.webmanifest": [{ name: "Citylit", start_url: "/" }, "application/manifest+json"],
    "/not-a-city": ["<h1>Not found</h1>", "text/html", 404],
    ...overrides,
  };
  return async (url, options) => {
    assert.equal(url.origin, "https://citylit.vercel.app");
    assert.equal(options.redirect, "manual");
    assert.equal(options.headers.authorization, undefined);
    const [body, type, status = 200] = pages[url.pathname];
    return new Response(typeof body === "string" ? body : JSON.stringify(body), {
      status,
      headers: { "content-type": type },
    });
  };
}

test("healthy production checks cover the release and boot asset", async () => {
  const result = await checkProduction(fixture());
  assert.equal(result.revision, revision);
  assert.equal(result.checked.length, 13);
  assert.ok(result.checked.includes("/models/stage/dome.glb"));
  assert.ok(result.checked.includes("/_next/static/app.js"));
});

test("outages, login redirects and missing bootstrap code fail closed", async () => {
  for (const overrides of [
    { "/api/health": ["unavailable", "text/html", 503] },
    { "/": ["sign in", "text/html", 307] },
    { "/": ["<h1>Discover South Africa.</h1>", "text/html"] },
    { "/_next/static/app.js": ["login", "text/html"] },
    { "/_next/static/app.js": ["", "application/javascript"] },
    { "/api/health": [{ status: "ok", revision: null }, "application/json"] },
  ])
    await assert.rejects(checkProduction(fixture(overrides)));
});

test("incomplete catalogs, malformed manifests and oversized responses fail", async () => {
  for (const overrides of [
    { "/data/places.json": [{ error: "bad data" }, "application/json"] },
    { "/data/places.json": [[{ city: "cape-town" }], "application/json"] },
    { "/manifest.webmanifest": [{ name: "Citylit" }, "application/manifest+json"] },
    { "/": ["x".repeat(2 * 1024 * 1024 + 1), "text/html"] },
  ])
    await assert.rejects(checkProduction(fixture(overrides)));
});

test("GLB checks work with multi-megabyte models and bounded requests", async () => {
  const request = fixture();
  const requested = [];
  const result = await checkProduction((url, options) => {
    if (url.pathname.endsWith(".glb")) {
      assert.equal(options.headers.range, "bytes=0-3");
      requested.push(url.pathname);
    }
    return request(url, options);
  });
  assert.deepEqual(requested, ["/models/stage/table-mountain.glb", "/models/stage/dome.glb"]);
  assert.ok(result.checked.includes("/models/stage/dome.glb"));
});

test("GLB signature, manifest metadata, and range integrity fail closed", async () => {
  const actual = Array.from({ length: 15 }, (_, i) => ({
    src: i === 1 ? "/models/stage/dome.glb" : "/models/stage/table-mountain.glb",
    bytes: i === 1 ? 4_101_264 : 2_462_112,
  }));
  for (const bad of [
    [{ src: "/models/stage/dome.glb", bytes: -1 }, ...actual.slice(1)],
    [{ src: "/models/stage/../../secrets.glb", bytes: 128 }, ...actual.slice(1)],
    [{ src: "/models/stage/dome.glb", bytes: "4101264" }, ...actual.slice(1)],
  ]) {
    await assert.rejects(
      checkProduction(
        fixture({
          "/models/stage/manifest.json": [bad, "application/json"],
        }),
      ),
      /Model manifest is invalid/,
    );
  }
  await assert.rejects(
    checkProduction(
        fixture({
          "/models/stage/dome.glb": ["bad!", "model/gltf-binary"],
        }),
      ),
    /invalid GLB signature/,
  );
  await assert.rejects(
    checkProduction(
        fixture({
          "/models/stage/dome.glb": ["glTF", "text/plain"],
        }),
      ),
    /unexpected content type/,
  );
  const original = fixture();
  await assert.rejects(
    checkProduction((url, options) =>
      url.pathname === "/models/stage/dome.glb"
        ? new Response("glTF", {
            status: 206,
            headers: {
              "content-type": "model/gltf-binary",
              "content-range": "bytes 1-4/4101264",
            },
          })
        : original(url, options),
    ),
    /invalid binary range response/,
  );
});

test("a release changing mid-check is retried instead of reporting false success", async () => {
  let healthRequests = 0;
  const request = fixture();
  await assert.rejects(
    checkProduction((url, options) => {
      if (url.pathname === "/api/health" && ++healthRequests > 1) {
        return new Response(JSON.stringify({ status: "ok", revision: "b".repeat(40) }), {
          headers: { "content-type": "application/json" },
        });
      }
      return request(url, options);
    }),
    /Production changed/,
  );
});
