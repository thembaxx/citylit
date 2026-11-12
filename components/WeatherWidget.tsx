"use client";

import { useEffect, useState } from "react";

type Weather = { temp: number; code: number };
type Tone = "clear" | "cloud" | "rain" | "storm" | "fog";

const cache = new Map<string, { at: number; weather: Weather }>();
const labels: Record<Tone, string> = {
  clear: "Clear",
  cloud: "Cloudy",
  rain: "Rain",
  storm: "Storm",
  fog: "Fog",
};

function toneFor(code: number): Tone {
  if (code === 0) return "clear";
  if (code === 45 || code === 48) return "fog";
  if (code >= 95) return "storm";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  return "cloud";
}

export default function WeatherWidget({
  name,
  longitude,
  latitude,
}: {
  name: string;
  longitude: number;
  latitude: number;
}) {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const key = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < 30 * 60 * 1000) {
      setWeather(hit.weather);
      setFailed(false);
      return;
    }
    const controller = new AbortController();
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=Africa%2FJohannesburg`;
    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json();
      })
      .then((data: { current?: { temperature_2m?: number; weather_code?: number } }) => {
        const temp = data.current?.temperature_2m;
        const code = data.current?.weather_code;
        if (typeof temp !== "number" || typeof code !== "number") throw new Error("shape");
        const next = { temp: Math.round(temp), code };
        cache.set(key, { at: Date.now(), weather: next });
        setWeather(next);
        setFailed(false);
      })
      .catch((error: { name?: string }) => {
        if (error?.name !== "AbortError") setFailed(true);
      });
    return () => controller.abort();
  }, [latitude, longitude]);

  const tone = weather ? toneFor(weather.code) : "cloud";
  return (
    <p className={`weather-widget is-${tone}`} aria-live="polite">
      <span className={`weather-glyph is-${tone}`} aria-hidden="true">
        <span className="weather-sun" />
        <span className="weather-cloud" />
        <span className="weather-rain" />
      </span>
      <span className="weather-copy">
        <strong>{weather ? `${weather.temp}°` : "—"}</strong>
        <span>
          {name}
          {weather
            ? ` · ${labels[tone]}`
            : failed
              ? " · Weather unavailable"
              : " · Checking weather"}
        </span>
      </span>
    </p>
  );
}
