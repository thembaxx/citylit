import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const workflow = readFileSync(
  new URL("../.github/workflows/deployment-smoke.yml", import.meta.url),
  "utf8",
);
const script = workflow
  .split("          script: |\n")[1]
  .split("\n")
  .map((line) => line.replace(/^ {12}/, ""))
  .join("\n");
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
function smoke(
  fetcher: typeof fetch,
  url = "https://citylit.vercel.app",
  environment?: "Production",
) {
  const states: string[] = [];
  const run = new AsyncFunction("context", "github", "core", "fetch", "process", script)(
    {
      repo: { owner: "thembaxx", repo: "citylit" },
      payload: environment ? { deployment: { sha: "a".repeat(40), environment } } : {},
      runId: 1,
    },
    {
      rest: {
        repos: { createCommitStatus: async ({ state }: { state: string }) => states.push(state) },
      },
    },
    { info: () => {} },
    fetcher,
    { env: { DEPLOYMENT_URL: url } },
  ) as Promise<void>;
  return { run, states };
}

test("deployment smoke validates real production routes before publishing success", async ({
  baseURL,
}) => {
  const paths: string[] = [];
  const result = smoke(async (input, init) => {
    const url = new URL(String(input));
    paths.push(url.pathname);
    return fetch(new URL(url.pathname + url.search, baseURL), init);
  });
  await result.run;
  // Manual checks have no deployment commit on which to publish a status.
  expect(result.states).toEqual([]);
  expect(paths).toContain("/api/health");
  expect(paths).toContain("/not-a-city");
  expect(paths.some((path) => path.startsWith("/_next/static/"))).toBe(true);
});

test("deployment smoke rejects unsafe URLs without requesting them", async () => {
  const authenticated = new URL("https://citylit.vercel.app");
  authenticated.username = "fixture";
  authenticated.password = "fixture";
  for (const url of [
    "http://citylit.vercel.app",
    "https://citylit.vercel.app.evil.example",
    authenticated.href,
    "https://unrelated.vercel.app",
    "https://citylit-preview-thembaxxs-projects.vercel.app",
    "https://citylit.vercel.app:8443",
  ]) {
    let calls = 0;
    const result = smoke(async () => {
      calls++;
      return new Response();
    }, url);
    await expect(result.run).rejects.toThrow("public Citylit production URL");
    expect(calls).toBe(0);
    expect(result.states).toEqual([]);
  }
});

test("protected production fails clearly without following the sign-in redirect", async () => {
  const result = smoke(
    async () =>
      new Response(null, {
        status: 302,
        headers: { location: "https://vercel.com/sso-api?url=production" },
      }),
  );
  await expect(result.run).rejects.toThrow("production deployment must be publicly accessible");
  expect(result.states).toEqual([]);
});

test("production smoke rejects preview redirects without sending a bypass header", async () => {
  const origins: string[] = [];
  const result = smoke(async (input, init) => {
    const url = new URL(String(input));
    origins.push(url.origin);
    const header = new Headers(init?.headers).get("x-vercel-protection-bypass");
    expect(header).toBeNull();
    return new Response(null, {
      status: 302,
      headers: { location: "https://citylit-another-thembaxxs-projects.vercel.app/" },
    });
  }, "https://citylit.vercel.app");
  await expect(result.run).rejects.toThrow("public Citylit production URL");
  expect(origins).toEqual(["https://citylit.vercel.app"]);
  expect(result.states).toEqual([]);
});

test("deployment smoke blocks redirects away from the allowed host boundary", async () => {
  let calls = 0;
  const result = smoke(async () => {
    calls++;
    return new Response(null, { status: 302, headers: { location: "https://127.0.0.1/private" } });
  });
  await expect(result.run).rejects.toThrow("public Citylit production URL");
  expect(calls).toBe(1);
  expect(result.states).toEqual([]);
});

test("health and security headers preserve opt-in location discovery", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ status: "ok" });
  expect(response.headers()["cache-control"]).toBe("no-store");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["permissions-policy"]).toContain("geolocation=(self)");
  expect(response.headers()["content-security-policy"]).toContain("frame-ancestors 'self'");
  expect(response.headers()["x-powered-by"]).toBeUndefined();
});

test("production smoke rejects an older public release before checking its routes", async () => {
  const urls: string[] = [];
  const result = smoke(
    async (input) => {
      urls.push(String(input));
      return Response.json({ status: "ok", revision: "b".repeat(40) });
    },
    "https://citylit-release-thembaxxs-projects.vercel.app",
    "Production",
  );
  await expect(result.run).rejects.toThrow("not serving this deployment's commit");
  expect(urls).toEqual(["https://citylit.vercel.app/api/health"]);
  expect(result.states).toEqual(["pending", "failure"]);
});

test("production smoke uses the public alias only after verifying its exact commit", async ({
  baseURL,
}) => {
  const origins: string[] = [];
  const result = smoke(
    async (input, init) => {
      const url = new URL(String(input));
      origins.push(url.origin);
      // Fixture represents the deployed commit while route bodies come from the real build.
      if (url.pathname === "/api/health")
        return Response.json({ status: "ok", revision: "a".repeat(40) });
      return fetch(new URL(url.pathname + url.search, baseURL), init);
    },
    "https://citylit-release-thembaxxs-projects.vercel.app",
    "Production",
  );
  await result.run;
  expect(new Set(origins)).toEqual(new Set(["https://citylit.vercel.app"]));
  expect(result.states).toEqual(["pending", "success"]);
});
