"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Cube, MapPin, ShareNetwork, Star } from "@phosphor-icons/react";
import type { Place } from "../lib/data";
import { type GuideCity } from "../lib/discovery-guide";
import { places } from "../lib/data";
import Gallery from "./Gallery";
import PlaceContext from "./PlaceContext";
import PlaceActions from "./PlaceActions";
import SavePlace from "./SavePlace";
import { useDiscovery } from "./useDiscovery";
import { MAX_TRIP_STOPS } from "../lib/client-data";
import SlideToConfirm from "./ui/SlideToConfirm";
import DynamicIslandToast from "./ui/DynamicIslandToast";
import BenchoComparisonSlider from "./ui/BenchoComparisonSlider";
import { benchoAudio } from "../lib/bencho-audio";

export type DetailTab = "overview" | "history" | "nearby" | "tips";

export default function VenueDetailView({ city, place }: { city: GuideCity; place: Place }) {
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [message, setMessage] = useState("");
  const { state, update } = useDiscovery();
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name}, ${place.address}, ${city.name}, South Africa`)}`;
  const heroImage = place.images[0];
  const inDay = state.itinerary.includes(place.id);

  const nearbyPlaces = places.filter((p) => p.city === city.slug && p.id !== place.id).slice(0, 3);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: place.name, url: location.href });
      } else {
        await navigator.clipboard.writeText(location.href);
      }
    } catch {
      // Ignored
    }
  };

  const handleToggleDay = () => {
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
    <article className="citylit-detail-page" key={place.id}>
      {/* Hero Header with Full-Bleed Image (Image 3 Screen 4) */}
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

        {/* Floating Top Controls (Image 3 Screen 4) */}
        <div className="citylit-detail-top-bar">
          <Link
            href={`/${city.slug}#places`}
            className="citylit-detail-circle-btn"
            aria-label={`Back to ${city.name}`}
          >
            <ArrowLeft size={20} weight="bold" />
          </Link>
          <div className="citylit-detail-top-actions">
            <SavePlace id={place.id} name={place.name} />
            <button
              type="button"
              className="citylit-detail-circle-btn"
              onClick={handleShare}
              aria-label="Share place"
            >
              <ShareNetwork size={20} />
            </button>
          </div>
        </div>

        {/* Hero Copy (Image 3 Screen 4) */}
        <div className="citylit-detail-hero-copy">
          <div className="citylit-featured-badge">
            <Star size={12} weight="fill" /> Featured
          </div>
          <h1>
            {place.name}
            <span className="atlas-title-period">.</span>
          </h1>
          <div className="citylit-detail-subhead">
            <div className="citylit-detail-location">
              <MapPin size={16} weight="fill" />
              <span>{city.name}, South Africa</span>
            </div>
            <div className="citylit-detail-rating">
              <Star size={15} weight="fill" className="rating-star" />
              <strong>4.8</strong>
              <span>(12k reviews)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3D Stage Quick Link */}
      <div className="citylit-detail-3d-banner">
        <Link
          className="citylit-detail-3d-btn"
          href={`/${city.slug}/places?place=${encodeURIComponent(place.id)}`}
        >
          <Cube size={18} weight="duotone" /> Explore in 3D
        </Link>
      </div>

      {/* Tabs Row (Image 3 Screen 4: Overview, History, Nearby, Tips) */}
      <div className="citylit-detail-tabs-bar" role="tablist" aria-label="Place details">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "overview"}
          className={`citylit-detail-tab ${activeTab === "overview" ? "is-active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
          {activeTab === "overview" && <span className="citylit-detail-tab-line" />}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "history"}
          className={`citylit-detail-tab ${activeTab === "history" ? "is-active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          History
          {activeTab === "history" && <span className="citylit-detail-tab-line" />}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "nearby"}
          className={`citylit-detail-tab ${activeTab === "nearby" ? "is-active" : ""}`}
          onClick={() => setActiveTab("nearby")}
        >
          Nearby
          {activeTab === "nearby" && <span className="citylit-detail-tab-line" />}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "tips"}
          className={`citylit-detail-tab ${activeTab === "tips" ? "is-active" : ""}`}
          onClick={() => setActiveTab("tips")}
        >
          Tips
          {activeTab === "tips" && <span className="citylit-detail-tab-line" />}
        </button>
      </div>

      {/* Tab Panels */}
      <div className="citylit-detail-body">
        {activeTab === "overview" && (
          <div className="citylit-tab-panel">
            <p className="citylit-lead-desc">{place.description}</p>

            {place.images.length > 1 && (
              <div className="citylit-detail-comparison-section">
                <h3 className="citylit-detail-section-title">Interactive Perspective Slider</h3>
                <BenchoComparisonSlider
                  beforeLabel="Perspective 1"
                  afterLabel="Perspective 2"
                  beforeLayer={
                    <Image
                      src={place.images[0].src}
                      alt={place.images[0].alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 800px"
                      style={{ objectFit: "cover" }}
                    />
                  }
                  afterLayer={
                    <Image
                      src={place.images[1].src}
                      alt={place.images[1].alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 800px"
                      style={{ objectFit: "cover" }}
                    />
                  }
                />
              </div>
            )}

            <Gallery images={place.images} context={place.imageContext} name={place.name} />

            <div className="atlas-visit-panel">
              <h2 id="visit-panel-title">
                Plan your <em>visit.</em>
              </h2>
              <div className="atlas-address">
                <MapPin size={20} aria-hidden="true" />
                <div>
                  <strong>{place.address}</strong>
                  <p>
                    {city.name}, {city.province}
                  </p>
                </div>
              </div>
              <div className="atlas-visit-links">
                <a href={maps} className="atlas-button" target="_blank" rel="noreferrer">
                  Find on Google Maps <ArrowUpRight size={16} />
                </a>
                <a
                  href={place.website}
                  className="atlas-button atlas-primary"
                  target="_blank"
                  rel="noreferrer"
                >
                  Visit official website <ArrowUpRight size={16} />
                </a>
              </div>
              <PlaceActions place={place} />
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="citylit-tab-panel">
            <div className="citylit-story-card">
              <h2>Heritage &amp; Story</h2>
              <PlaceContext place={place} />
            </div>
            {place.website && (
              <p>
                <a href={place.website} className="atlas-button" target="_blank" rel="noreferrer">
                  Visit official website <ArrowUpRight size={16} />
                </a>
              </p>
            )}
          </div>
        )}

        {activeTab === "nearby" && (
          <div className="citylit-tab-panel">
            <h2>Nearby in {city.name}</h2>
            <div className="citylit-nearby-grid">
              {nearbyPlaces.map((np) => (
                <Link
                  key={np.id}
                  href={`/${city.slug}/${np.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/${np.id}`}
                  className="citylit-nearby-card"
                >
                  {np.images[0] && (
                    <div className="citylit-nearby-thumb">
                      <Image src={np.images[0].src} alt={np.images[0].alt} fill sizes="100px" />
                    </div>
                  )}
                  <div>
                    <strong>{np.name}</strong>
                    <p>{np.category}</p>
                  </div>
                  <ArrowUpRight size={16} className="citylit-nearby-arrow" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {activeTab === "tips" && (
          <div className="citylit-tab-panel">
            <div className="citylit-tips-card">
              <h2>Practical Tips &amp; Access</h2>
              <p className="atlas-plan-note">
                {place.coordinateAccuracy === "venue"
                  ? "A venue pin is available; the entrance may differ. Confirm your arrival point with the operator."
                  : "The catalog has a city-reference pin. Maps searches the venue name and address; confirm the result before travelling."}
              </p>

              <details className="atlas-source-details" open>
                <summary>Sources &amp; research · {place.checkedAt}</summary>
                <p>
                  Source checks are catalog research, not live confirmation. Check hours, prices and
                  accessibility with the venue.
                </p>
                <ul>
                  {place.sources.map((source) => (
                    <li key={source.url}>
                      <a href={source.url} target="_blank" rel="noreferrer">
                        {source.title} <ArrowUpRight size={12} />
                      </a>
                      <span>
                        Checked {source.fetchedAt} ·{" "}
                        {source.status === "fetched" ? "source retrieved" : "source unavailable"}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom CTA with Bencho SlideToConfirm micro-interaction */}
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

      {/* Bencho Dynamic Island Toast */}
      <DynamicIslandToast message={message} onDismiss={() => setMessage("")} />
    </article>
  );
}
