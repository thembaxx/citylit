import { createServer } from "node:http";
import { test, expect } from "@playwright/test";
import { POST } from "../app/api/itinerary/route";

const nativeFetch = globalThis.fetch;
const request = (coordinates: unknown) =>
  new Request("https://citylit.example/api/itinerary", {
    method: "POST",
    headers: { origin: "https://citylit.example", "content-type": "application/json" },
    body: JSON.stringify({ coordinates }),
  });

test.afterEach(() => {
  globalThis.fetch = nativeFetch;
});

test("routing keeps a fixed HTTPS origin and disables redirects for valid coordinate boundaries", async () => {
  const coordinates = Array.from({ length: 12 }, (_, index) =>
    index % 2 ? [180, 85] : [-180, -85],
  );
  let calls = 0;
  globalThis.fetch = async (input, options) => {
    calls += 1;
    expect(input).toBeInstanceOf(URL);
    const url = new URL(String(input));
    expect(url.origin).toBe("https://router.project-osrm.org");
    expect(url.protocol).toBe("https:");
    expect(url.username).toBe("");
    expect(url.password).toBe("");
    expect(url.pathname).toBe(
      `/route/v1/driving/${coordinates.map((point) => point.join(",")).join(";")}`,
    );
    expect([...url.searchParams]).toEqual([
      ["overview", "false"],
      ["steps", "false"],
    ]);
    expect(options?.redirect).toBe("error");
    expect(options?.cache).toBe("no-store");
    return Response.json({
      code: "Ok",
      routes: [{ legs: Array.from({ length: 11 }, () => ({ duration: 61 })) }],
    });
  };
  const response = await POST(request(coordinates));
  expect(response.status).toBe(200);
  expect((await response.json()).minutes).toEqual(Array(11).fill(2));
  expect(calls).toBe(1);
});

test("host, protocol and path injection and invalid coordinates never reach the routing provider", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    throw new Error("Unexpected upstream request");
  };
  const invalid = [
    [
      ["https://127.0.0.1/private", 0],
      [1, 1],
    ],
    [
      ["//attacker.example", 0],
      [1, 1],
    ],
    [
      ["1;@attacker.example", 0],
      [1, 1],
    ],
    [
      ["file:///etc/passwd", 0],
      [1, 1],
    ],
    [
      ["0?redirect=https://attacker.example", 0],
      [1, 1],
    ],
    [
      [181, 0],
      [1, 1],
    ],
    [
      [0, -86],
      [1, 1],
    ],
    [
      [NaN, 0],
      [1, 1],
    ],
    [
      [Infinity, 0],
      [1, 1],
    ],
    [
      [null, 0],
      [1, 1],
    ],
    [
      [0, 0, 0],
      [1, 1],
    ],
    [[0, 0]],
    Array.from({ length: 13 }, () => [0, 0]),
  ];
  for (const coordinates of invalid) {
    expect((await POST(request(coordinates))).status).toBe(400);
  }
  const overflowingNumber = new Request("https://citylit.example/api/itinerary", {
    method: "POST",
    headers: { origin: "https://citylit.example", "content-type": "application/json" },
    body: '{"coordinates":[[1e309,0],[0,0]]}',
  });
  expect((await POST(overflowingNumber)).status).toBe(400);
  expect(calls).toBe(0);
});

test("an upstream redirect is rejected without requesting its target and retains manual fallback", async () => {
  let redirectedRequests = 0;
  const server = createServer((req, res) => {
    if (req.url === "/redirect") {
      res.writeHead(302, { location: "/private-target" });
      res.end();
      return;
    }
    redirectedRequests += 1;
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ code: "Ok", routes: [{ legs: [{ duration: 0 }] }] }));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing fixture address");
  const fixture = `http://127.0.0.1:${address.port}/redirect`;
  globalThis.fetch = async (input, options) => {
    expect(new URL(String(input)).origin).toBe("https://router.project-osrm.org");
    // Exercise native fetch redirect handling against a local fixture, preserving
    // every production request option rather than mocking a redirect rejection.
    return nativeFetch(fixture, options);
  };
  try {
    const response = await POST(
      request([
        [18.4, -33.9],
        [18.5, -33.8],
      ]),
    );
    expect(response.status).toBe(503);
    expect((await response.json()).error).toContain("Enter travel times manually");
    expect(redirectedRequests).toBe(0);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
