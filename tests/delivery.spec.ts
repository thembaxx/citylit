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
function smoke(fetcher: typeof fetch, url = "https://citylit.vercel.app", bypass?: string) {
  const states: string[] = [];
  const run = new AsyncFunction("context", "github", "core", "fetch", "process", script)(
    {
      repo: { owner: "thembaxx", repo: "citylit" },
      payload: { deployment: { sha: "a".repeat(40) } },
      runId: 1,
    },
    {
      rest: {
        repos: { createCommitStatus: async ({ state }: { state: string }) => states.push(state) },
      },
    },
    { info: () => {} },
    fetcher,
    { env: { DEPLOYMENT_URL: url, VERCEL_AUTOMATION_BYPASS_SECRET: bypass } },
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
  expect(result.states).toEqual(["pending", "success"]);
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
    "https://citylit.vercel.app:8443",
  ]) {
    let calls = 0;
    const result = smoke(async () => {
      calls++;
      return new Response();
    }, url);
    await expect(result.run).rejects.toThrow("HTTPS Vercel deployments");
    expect(calls).toBe(0);
    expect(result.states).toEqual(["failure"]);
  }
});

test("protected previews fail clearly without following the sign-in redirect", async () => {
  const result = smoke(
    async () =>
      new Response(null, {
        status: 302,
        headers: { location: "https://vercel.com/sso-api?url=preview" },
      }),
  );
  await expect(result.run).rejects.toThrow("configure VERCEL_AUTOMATION_BYPASS_SECRET");
  expect(result.states).toEqual(["pending", "failure"]);
});

test("bypass header is confined to the original deployment origin", async () => {
  const origins: string[] = [];
  const result = smoke(
    async (input, init) => {
      const url = new URL(String(input));
      origins.push(url.origin);
      const header = new Headers(init?.headers).get("x-vercel-protection-bypass");
      if (origins.length === 1) {
        expect(header).toBe("fixture");
        return new Response(null, {
          status: 302,
          headers: { location: "https://citylit-another-thembaxxs-projects.vercel.app/" },
        });
      }
      expect(header).toBeNull();
      return new Response(null, { status: 503 });
    },
    "https://citylit.vercel.app",
    "fixture",
  );
  await expect(result.run).rejects.toThrow("expected 200, got 503");
  expect(origins).toHaveLength(2);
  expect(result.states).toEqual(["pending", "failure"]);
});

test("deployment smoke blocks redirects away from the allowed host boundary", async () => {
  let calls = 0;
  const result = smoke(async () => {
    calls++;
    return new Response(null, { status: 302, headers: { location: "https://127.0.0.1/private" } });
  });
  await expect(result.run).rejects.toThrow("HTTPS Vercel deployments");
  expect(calls).toBe(1);
  expect(result.states).toEqual(["pending", "failure"]);
});

test("health and security headers preserve opt-in location discovery", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" });
  expect(response.headers()["cache-control"]).toBe("no-store");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["permissions-policy"]).toContain("geolocation=(self)");
  expect(response.headers()["content-security-policy"]).toContain("frame-ancestors 'self'");
  expect(response.headers()["x-powered-by"]).toBeUndefined();
});
