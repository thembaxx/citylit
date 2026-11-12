"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  BookmarkSimple,
  Cube,
  MapPin,
  ShareNetwork,
  Star,
} from "@phosphor-icons/react";
import { landmarkSources, places } from "../lib/data";
import { landmarkVenue, type GuideCity } from "../lib/discovery-guide";
import GuideShell from "./GuideShell";
import Gallery from "./Gallery";
import TiltCard from "./ui/TiltCard";
import SlideToConfirm from "./ui/SlideToConfirm";
import DynamicIslandToast from "./ui/DynamicIslandToast";
import { useDiscovery } from "./useDiscovery";
import { MAX_TRIP_STOPS } from "../lib/client-data";
import { benchoAudio } from "../lib/bencho-audio";

export default function LandmarkStory({ city, index }: { city: GuideCity; index: number }) {
  const name = city.landmarks[index];
  const record = landmarkSources.find((item) => item.name === name);
  const place = landmarkVenue(city.slug, name);
  const { state, update } = useDiscovery();
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "facts" | "sources">(
    "overview",
  );
  const [message, setMessage] = useState("");

  const heroImage = record?.images[0];
  const inDay = place ? state.itinerary.includes(place.id) : false;

  const handleShare = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: name, url: location.href });
      } else if (typeof navigator !== "undefined") {
        await navigator.clipboard.writeText(location.href);
        setMessage("Link copied to clipboard");
      }
    } catch {
      // Ignored
    }
  };

  const handleToggleDay = () => {
    if (!place) {
      setMessage("This landmark is an observational monument without a venue record.");
      return;
    }
    const first = places.find((p) => p.id === state.itinerary[0]);
    if (!inDay && first && first.city !== place.city) {
      setMessage("Your day belongs to another destination. Clear it in My day first.");
      return;
    }
    if (!inDay && state.itinerary.length >= MAX_TRIP_STOPS) {
      setMessage(`Your day has reached ${MAX_TRIP_STOPS} stops. Remove a stop first.`);
      return;
    }
    const saved = update((prev) => ({
      itinerary: inDay
        ? prev.itinerary.filter((id) => id !== place.id)
        : Array.from(new Set([...prev.itinerary, place.id])),
    }));
    setMessage(
      saved
        ? inDay
          ? "Removed from your day."
          : "Added to your day."
        : "This browser could not save your day. Allow site storage and try again.",
    );
  };

  return (
    <GuideShell>
      <article className="citylit-detail-page citylit-landmark-story-page">
        {/* Full-Bleed Hero (Image 1 Screen 4) */}
        <div className="citylit-detail-hero">
          {heroImage && (
            <div className="citylit-detail-hero-media">
              <Image
                src={heroImage.src}
                alt={heroImage.alt}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 1200px"
              />
              <div className="citylit-detail-hero-gradient" />
            </div>
          )}

          {/* Floating Top Bar */}
          <div className="citylit-detail-top-bar">
            <Link
              href={`/${city.slug}#landmarks`}
              className="citylit-detail-circle-btn"
              aria-label={`Back to ${city.name}`}
            >
              <ArrowLeft size={20} weight="bold" />
            </Link>
            <div className="citylit-detail-top-actions">
              <button
                type="button"
                className={`citylit-detail-circle-btn ${inDay ? "is-active" : ""}`}
                onClick={handleToggleDay}
                aria-label={inDay ? "Remove from my day" : "Save to my day"}
              >
                <BookmarkSimple size={20} weight={inDay ? "fill" : "regular"} />
              </button>
              <button
                type="button"
                className="citylit-detail-circle-btn"
                onClick={handleShare}
                aria-label="Share landmark"
              >
                <ShareNetwork size={20} />
              </button>
            </div>
          </div>

          {/* Hero Copy */}
          <div className="citylit-detail-hero-copy">
            <div className="citylit-featured-badge">
              <Star size={12} weight="fill" /> Featured
            </div>
            <h1>
              {name}
              <span className="atlas-title-period">.</span>
            </h1>
            <div className="citylit-detail-subhead">
              <div className="citylit-detail-location">
                <MapPin size={16} weight="fill" />
                <span>
                  {city.name}, {city.province}
                </span>
              </div>
              <div className="citylit-detail-rating">
                <Star size={15} weight="fill" className="rating-star" />
                <strong>4.8</strong>
                <span>(12k reviews)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3D Explore Quick Banner */}
        <div className="citylit-detail-3d-banner">
          <Link
            className="citylit-detail-3d-btn"
            href={`/${city.slug}/landmarks?landmark=${encodeURIComponent(name)}`}
          >
            <Cube size={18} weight="duotone" /> Explore {name} in 3D
          </Link>
        </div>

        {/* Tabs Bar (Overview, History, Facts, Sources) */}
        <div className="citylit-detail-tabs-bar" role="tablist" aria-label="Landmark sections">
          {(["overview", "history", "facts", "sources"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              className={`citylit-detail-tab ${activeTab === tab ? "is-active" : ""}`}
              onClick={() => {
                benchoAudio.playTap(780);
                setActiveTab(tab);
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {activeTab === tab && <span className="citylit-detail-tab-line" />}
            </button>
          ))}
        </div>

        {/* Tab Panels */}
        <div className="citylit-detail-body">
          {activeTab === "overview" && (
            <div className="citylit-tab-panel">
              <p className="citylit-lead-desc">{city.descriptions[index]}</p>
              {record?.images.length ? (
                <Gallery images={record.images} context="landmark" name={name} />
              ) : null}
            </div>
          )}

          {activeTab === "history" && (
            <div className="citylit-tab-panel">
              {record?.about ? (
                <TiltCard className="atlas-story-about" maxTilt={1.6}>
                  <h2>
                    The story <em>behind it.</em>
                  </h2>
                  <p>{record.about}</p>
                  {record.aboutSource && (
                    <a href={record.aboutSource} target="_blank" rel="noreferrer">
                      Read background on Wikipedia <ArrowUpRight size={14} />
                    </a>
                  )}
                </TiltCard>
              ) : (
                <p>Detailed historical monographs are being compiled for this landmark.</p>
              )}
            </div>
          )}

          {activeTab === "facts" && (
            <div className="citylit-tab-panel">
              {record?.facts?.length ? (
                <dl className="atlas-story-facts">
                  {record.facts.map((fact) => (
                    <div key={fact.label}>
                      <dt>{fact.label}</dt>
                      <dd>{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p>Public entry and visiting hours are verified through local operators.</p>
              )}
            </div>
          )}

          {activeTab === "sources" && (
            <div className="citylit-tab-panel">
              <div className="citylit-tips-box">
                <p>
                  This landmark story is researched from publicly accessible historical records and
                  survey observations. Visiting arrangements and accessibility should be confirmed
                  locally.
                </p>
                {record?.aboutLicense && (
                  <p className="atlas-photo-credit">
                    <a href={record.aboutLicense} target="_blank" rel="noreferrer">
                      Wikipedia contributors · CC BY-SA 4.0
                    </a>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Bottom CTA */}
        {place && (
          <div className="citylit-detail-sticky-footer">
            <SlideToConfirm
              label="Slide to add to My Day"
              confirmedLabel="In your day · Tap to remove"
              isConfirmed={inDay}
              onConfirm={() => {
                benchoAudio.playConfirm();
                if (!inDay) handleToggleDay();
              }}
              onReset={() => {
                benchoAudio.playClick(440);
                if (inDay) handleToggleDay();
              }}
            />
          </div>
        )}

        <DynamicIslandToast message={message} onDismiss={() => setMessage("")} />
      </article>
    </GuideShell>
  );
}
