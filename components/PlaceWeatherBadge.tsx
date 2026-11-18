"use client";

import { useEffect, useState } from "react";
import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
} from "@phosphor-icons/react";

type Weather = { temp: number; code: number };

export type PlaceWeatherCondition =
  | "clear"
  | "partly-cloudy"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "thunderstorm";

const labels: Record<PlaceWeatherCondition, string> = {
  clear: "Clear sky",
  "partly-cloudy": "Partly cloudy",
  cloudy: "Cloudy",
  fog: "Fog",
  drizzle: "Drizzle",
  rain: "Rain",
  snow: "Snow",
  thunderstorm: "Thunderstorm",
};

const icons: Record<PlaceWeatherCondition, typeof Sun> = {
  clear: Sun,
  "partly-cloudy": CloudSun,
  cloudy: Cloud,
  fog: CloudFog,
  drizzle: CloudRain,
  rain: CloudRain,
  snow: CloudSnow,
  thunderstorm: CloudLightning,
};

/** WMO weather codes reported by the weather route. */
export function conditionForWeatherCode(code: number): PlaceWeatherCondition {
  if (code === 0) return "clear";
  if (code === 1 || code === 2) return "partly-cloudy";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95) return "thunderstorm";
  return "cloudy";
}

const cache = new Map<string, { at: number; weather: Weather }>();
const CACHE_MS = 30 * 60 * 1000;

/**
 * A tiny animated weather glyph for a place or landmark's info card. The badge
 * is decorative for sighted users but carries a full accessible name, and it
 * disappears quietly when the live forecast is unavailable (for example
 * offline), leaving the rest of the card untouched.
 */
export default function PlaceWeatherBadge({
  name,
  latitude,
  longitude,
  className = "",
}: {
  name: string;
  latitude?: number;
  longitude?: number;
  className?: string;
}) {
  const [weather, setWeather] = useState<Weather | null>(null);
  const hasCoords = Number.isFinite(latitude) && Number.isFinite(longitude);

  useEffect(() => {
    if (!hasCoords) return;
    const lat = latitude as number;
    const lon = longitude as number;
    const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_MS) {
      setWeather(hit.weather);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 6000);
    let dropped = false;
    fetch(`/api/weather?latitude=${lat}&longitude=${lon}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json();
      })
      .then((data: { temp?: number; code?: number }) => {
        if (typeof data.temp !== "number" || typeof data.code !== "number") {
          throw new Error("shape");
        }
        const next = { temp: Math.round(data.temp), code: data.code };
        cache.set(key, { at: Date.now(), weather: next });
        if (!dropped) setWeather(next);
      })
      .catch(() => {
        if (!dropped) setWeather(null);
      })
      .finally(() => window.clearTimeout(timer));
    return () => {
      dropped = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [latitude, longitude, hasCoords]);

  if (!weather || !hasCoords) return null;

  const condition = conditionForWeatherCode(weather.code);
  const Icon = icons[condition];
  const label = `Current weather at ${name}: ${labels[condition]}, ${weather.temp}°C`;

  return (
    <span
      className={`place-weather-badge is-${condition} ${className}`.trim()}
      role="img"
      aria-label={label}
      title={label}
      data-condition={condition}
    >
      <Icon size={13} weight="fill" className="place-weather-glyph" aria-hidden="true" />
    </span>
  );
}
