"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Sun,
  Moon,
  CloudSun,
  CloudRain,
  SpeakerHigh,
  SpeakerSlash,
  Clock,
  Sparkle,
} from "@phosphor-icons/react";
import { benchoAudio, type AmbientSoundType } from "../lib/bencho-audio";

export type TimePeriod = "dawn" | "midday" | "sunset" | "night" | "live";
export type WeatherType = "clear" | "cloudy" | "rain" | "sunset";

export interface AtmosphereState {
  timePeriod: TimePeriod;
  weather: WeatherType;
  temperature: number;
  isNight: boolean;
  rainIntensity: number; // 0 to 1
  sunAngle: number; // in radians
  lightColor: string;
  ambientSound: AmbientSoundType;
}

interface DioramaWeatherControllerProps {
  cityName?: string;
  className?: string;
  compact?: boolean;
  onAtmosphereChange?: (state: AtmosphereState) => void;
}

export default function DioramaWeatherController({
  cityName = "South Africa",
  className = "",
  compact = false,
  onAtmosphereChange,
}: DioramaWeatherControllerProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("midday");
  const [weather, setWeather] = useState<WeatherType>("clear");
  const [ambientActive, setAmbientActive] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState("12:00 PM");

  // Calculate live time periodically
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format time as HH:MM AM/PM
      const formatted = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      setCurrentTimeStr(formatted);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Compute atmosphere state based on selections
  const atmosphere: AtmosphereState = useMemo(() => {
    let effectivePeriod = timePeriod;
    if (timePeriod === "live") {
      const hours = new Date().getHours();
      if (hours >= 5 && hours < 9) effectivePeriod = "dawn";
      else if (hours >= 9 && hours < 16) effectivePeriod = "midday";
      else if (hours >= 16 && hours < 19) effectivePeriod = "sunset";
      else effectivePeriod = "night";
    }

    const isNight = effectivePeriod === "night";
    let sunAngle = Math.PI * 0.35; // Default midday
    let lightColor = "#ffffff";
    let temp = 24;

    switch (effectivePeriod) {
      case "dawn":
        sunAngle = Math.PI * 0.15;
        lightColor = "#ffd5a6";
        temp = 18;
        break;
      case "midday":
        sunAngle = Math.PI * 0.5;
        lightColor = "#ffffff";
        temp = 27;
        break;
      case "sunset":
        sunAngle = Math.PI * 0.85;
        lightColor = "#ff9a4d";
        temp = 22;
        break;
      case "night":
        sunAngle = Math.PI * 1.25;
        lightColor = "#7d90b8";
        temp = 16;
        break;
    }

    if (weather === "rain") temp -= 4;

    let ambientType: AmbientSoundType = "none";
    if (weather === "rain") ambientType = "rain";
    else if (isNight) ambientType = "night";
    else if (effectivePeriod === "sunset") ambientType = "waves";
    else ambientType = "wind";

    return {
      timePeriod,
      weather,
      temperature: temp,
      isNight,
      rainIntensity: weather === "rain" ? 1 : 0,
      sunAngle,
      lightColor,
      ambientSound: ambientType,
    };
  }, [timePeriod, weather]);

  // Notify parent on change
  useEffect(() => {
    onAtmosphereChange?.(atmosphere);
  }, [atmosphere, onAtmosphereChange]);

  // Handle ambient sound toggle
  const toggleAmbient = useCallback(() => {
    const next = !ambientActive;
    setAmbientActive(next);
    benchoAudio.setAmbientEnabled(next);
    if (next) {
      benchoAudio.startAmbient(atmosphere.ambientSound);
    } else {
      benchoAudio.stopAmbient();
    }
    benchoAudio.playLiquidToggle(next);
  }, [ambientActive, atmosphere.ambientSound]);

  // Update ambient audio if active and weather changes
  useEffect(() => {
    if (ambientActive) {
      benchoAudio.startAmbient(atmosphere.ambientSound);
    }
  }, [atmosphere.ambientSound, ambientActive]);

  const selectPeriod = (period: TimePeriod) => {
    benchoAudio.playTick(1200);
    setTimePeriod(period);
  };

  const selectWeather = (w: WeatherType) => {
    benchoAudio.playWeatherShift();
    setWeather(w);
  };

  const weatherIcons = {
    clear: <Sun size={16} weight="fill" className="text-amber-400" />,
    cloudy: <CloudSun size={16} weight="fill" className="text-slate-300" />,
    rain: <CloudRain size={16} weight="fill" className="text-blue-400" />,
    sunset: <Sparkle size={16} weight="fill" className="text-orange-400" />,
  };

  const weatherLabels: Record<WeatherType, string> = {
    clear: "Clear Sky",
    cloudy: "Partly Cloudy",
    rain: "Light Rain",
    sunset: "Golden Hour",
  };

  return (
    <div
      className={`citylit-weather-controller ${compact ? "is-compact" : ""} ${className}`}
      role="region"
      aria-label="Real-time diorama weather and time simulation"
    >
      {/* Real-time Weather & Time Badge (Image 6 & Image 8 style) */}
      <div className="weather-controller-badge">
        <div className="weather-badge-icon" aria-hidden="true">
          {weatherIcons[weather]}
        </div>
        <div className="weather-badge-info">
          <div className="weather-badge-time">
            <Clock size={12} aria-hidden="true" />
            <span>
              {timePeriod === "live"
                ? currentTimeStr
                : timePeriod === "dawn"
                  ? "06:30 AM"
                  : timePeriod === "midday"
                    ? "12:00 PM"
                    : timePeriod === "sunset"
                      ? "05:45 PM"
                      : "10:30 PM"}
            </span>
            <span className="weather-city-sep">·</span>
            <span className="weather-city-name">{cityName}</span>
          </div>
          <div className="weather-badge-condition">
            <strong>{atmosphere.temperature}°C</strong>
            <span>{weatherLabels[weather]}</span>
          </div>
        </div>

        {/* Ambient Soundscape Toggle (libraries.dev/waves inspired) */}
        <button
          type="button"
          className={`weather-audio-btn ${ambientActive ? "is-active" : ""}`}
          onClick={toggleAmbient}
          aria-label={
            ambientActive
              ? "Mute sensory ambient soundscape"
              : `Play organic ${atmosphere.ambientSound} soundscape`
          }
          title={
            ambientActive ? "Mute sensory soundscape" : `Play ${atmosphere.ambientSound} soundscape`
          }
        >
          {ambientActive ? <SpeakerHigh size={16} weight="fill" /> : <SpeakerSlash size={16} />}
        </button>
      </div>

      {/* Time of Day Scrubber / Presets (Image 8 style) */}
      <div className="weather-scrubber-row" role="group" aria-label="Time of day presets">
        {(
          [
            [
              "dawn",
              "Dawn",
              <Sun key="d" size={13} weight="regular" />,
              "Dawn morning time preset",
            ],
            ["midday", "12 PM", <Sun key="m" size={13} weight="fill" />, "Midday noon time preset"],
            [
              "sunset",
              "Sunset",
              <Sparkle key="s" size={13} weight="fill" />,
              "Golden hour sunset time preset",
            ],
            [
              "night",
              "Night",
              <Moon key="n" size={13} weight="fill" />,
              "Night twilight time preset",
            ],
            ["live", "LIVE", <Clock key="l" size={13} weight="bold" />, "Live local time preset"],
          ] as const
        ).map(([p, label, icon, ariaLbl]) => (
          <button
            key={p}
            type="button"
            className={`weather-scrub-btn ${timePeriod === p ? "is-active" : ""} ${p === "live" ? "is-live" : ""}`}
            aria-pressed={timePeriod === p}
            aria-label={ariaLbl}
            onClick={() => selectPeriod(p)}
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Atmospheric Weather Conditions Selector */}
      <div className="weather-condition-pills" role="group" aria-label="Weather conditions">
        {(
          [
            ["clear", "Clear", "Clear sky condition"],
            ["cloudy", "Cloudy", "Partly cloudy condition"],
            ["rain", "Rain", "Light rain condition"],
            ["sunset", "Sunset", "Golden sunset condition"],
          ] as const
        ).map(([w, label, ariaLbl]) => (
          <button
            key={w}
            type="button"
            className={`weather-cond-pill ${weather === w ? "is-active" : ""}`}
            aria-pressed={weather === w}
            aria-label={ariaLbl}
            onClick={() => selectWeather(w)}
          >
            {weatherIcons[w]}
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
