import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  if (!request.headers.get("content-type")?.includes("application/json"))
    return NextResponse.json({ error: "JSON required." }, { status: 415 });
  const text = await request.text();
  if (text.length > 8000) return NextResponse.json({ error: "Too many stops." }, { status: 413 });
  let coordinates: unknown;
  try {
    coordinates = JSON.parse(text).coordinates;
  } catch {
    return NextResponse.json({ error: "Invalid route." }, { status: 400 });
  }
  if (
    !Array.isArray(coordinates) ||
    coordinates.length < 2 ||
    coordinates.length > 12 ||
    !coordinates.every(
      (point: unknown) =>
        Array.isArray(point) &&
        point.length === 2 &&
        point.every((value) => typeof value === "number" && Number.isFinite(value)) &&
        Math.abs(point[0]) <= 180 &&
        Math.abs(point[1]) <= 85,
    )
  )
    return NextResponse.json(
      { error: "Choose between two and twelve valid venue pins." },
      { status: 400 },
    );
  try {
    const path = coordinates.map((point: number[]) => point.join(",")).join(";");
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${path}?overview=false&steps=false`,
      { signal: AbortSignal.timeout(10000), cache: "no-store" },
    );
    if (!response.ok) throw new Error("Routing unavailable");
    const data = await response.json();
    const legs = data.routes?.[0]?.legs;
    if (
      data.code !== "Ok" ||
      !Array.isArray(legs) ||
      legs.length !== coordinates.length - 1 ||
      !legs.every(
        (leg: { duration?: number }) =>
          typeof leg.duration === "number" &&
          Number.isFinite(leg.duration) &&
          leg.duration >= 0,
      )
    )
      throw new Error("Incomplete route");
    return NextResponse.json(
      {
        minutes: legs.map((leg: { duration: number }) => Math.ceil(leg.duration / 60)),
        source: "OSRM public driving estimate; excludes live traffic, parking and delays",
        checkedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Driving estimates are unavailable. Enter travel times manually; no missing leg is treated as zero." },
      { status: 503 },
    );
  }
}
