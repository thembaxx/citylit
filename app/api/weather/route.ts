/** Forecasts stay inside South Africa so this route cannot proxy arbitrary hosts. */
const BOUNDS = { minLat: -35.2, maxLat: -22, minLon: 16.3, maxLon: 33.1 };

export async function GET(request: Request) {
  const url = new URL(request.url);
  const latitude = Number(url.searchParams.get("latitude"));
  const longitude = Number(url.searchParams.get("longitude"));
  const inside =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= BOUNDS.minLat &&
    latitude <= BOUNDS.maxLat &&
    longitude >= BOUNDS.minLon &&
    longitude <= BOUNDS.maxLon;
  if (!inside) {
    return Response.json(
      { error: "outside" },
      {
        status: 400,
        headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
      },
    );
  }
  const upstream = new URL("https://api.open-meteo.com/v1/forecast");
  upstream.searchParams.set("latitude", latitude.toFixed(3));
  upstream.searchParams.set("longitude", longitude.toFixed(3));
  upstream.searchParams.set("current", "temperature_2m,weather_code");
  upstream.searchParams.set("timezone", "Africa/Johannesburg");
  try {
    const response = await fetch(upstream, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(String(response.status));
    const data = (await response.json()) as {
      current?: { temperature_2m?: number; weather_code?: number };
    };
    const temp = data.current?.temperature_2m;
    const code = data.current?.weather_code;
    if (typeof temp !== "number" || typeof code !== "number") throw new Error("shape");
    return Response.json(
      { temp: Math.round(temp), code },
      {
        headers: {
          "Cache-Control": "public, max-age=1800, s-maxage=1800",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch {
    return Response.json(
      { error: "unavailable" },
      {
        status: 502,
        headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
      },
    );
  }
}
