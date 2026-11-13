"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Cube, MapPin, ShareNetwork } from "@phosphor-icons/react";
import type { Place } from "../lib/data";
import { togglePlaceInDay, type GuideCity } from "../lib/discovery-guide";
import { places } from "../lib/data";
import Gallery from "./Gallery";
import PlaceContext from "./PlaceContext";
import PlaceActions from "./PlaceActions";
import SavePlace from "./SavePlace";
import { useDiscovery } from "./useDiscovery";
import { handleRovingKeyDown } from "../lib/ui-primitives";
import SlideToConfirm from "./ui/SlideToConfirm";
import DynamicIslandToast from "./ui/DynamicIslandToast";
import BenchoComparisonSlider from "./ui/BenchoComparisonSlider";
import SpotlightCard from "./ui/SpotlightCard";
import { MdxCallout, MdxTable } from "./ui/mdxcn";
import { benchoAudio } from "../lib/bencho-audio";

export type DetailTab = "overview" | "history" | "nearby" | "tips";

const DETAIL_TABS: Array<{ id: DetailTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "history", label: "History" },
  { id: "nearby", label: "Nearby" },
  { id: "tips", label: "Tips" },
];

export default function VenueDetailView({ city, place }: { city: GuideCity; place: Place }) {
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [message, setMessage] = useState("");
  const tabsId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const { state, update } = useDiscovery();
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name}, ${place.address}, ${city.name}, South Africa`)}`;
  const heroImage = place.images[0];
  const inDay = state.itinerary.includes(place.id);

  const nearbyPlaces = places.filter((p) => p.city === city.slug && p.id !== place.id).slice(0, 3);

  const handleShare = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: place.name, url: location.href });
      } else if (typeof navigator !== "undefined") {
        await navigator.clipboard.writeText(location.href);
        setMessage("Link copied to clipboard");
      }
    } catch {
      // Ignored
    }
  };

  const handleToggleDay = () => {
    const result = togglePlaceInDay(place, state.itinerary, update);
    setMessage(result.message);
    return result.ok;
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

        {/* Hero Copy */}
        <div className="citylit-detail-hero-copy">
          <div className="citylit-featured-badge">{place.category}</div>
          <h1>
            {place.name}
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
              <span>Catalog check · {place.checkedAt}</span>
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
        {DETAIL_TABS.map((tab, idx) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[idx] = el;
              }}
              type="button"
              role="tab"
              id={`${tabsId}-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`${tabsId}-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              className={`citylit-detail-tab ${isActive ? "is-active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) =>
                handleRovingKeyDown(
                  e,
                  idx,
                  DETAIL_TABS.length,
                  tabRefs,
                  (nextIdx) => setActiveTab(DETAIL_TABS[nextIdx].id),
                  "horizontal",
                )
              }
            >
              {tab.label}
              {isActive && <span className="citylit-detail-tab-line" />}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="citylit-detail-body">
        {activeTab === "overview" && (
          <div
            className="citylit-tab-panel"
            id={`${tabsId}-panel-overview`}
            role="tabpanel"
            aria-labelledby={`${tabsId}-tab-overview`}
          >
            <p className="citylit-lead-desc">{place.description}</p>

            {place.images.length > 1 && (
              <div className="citylit-detail-comparison-section">
                <h2 className="citylit-detail-section-title">Compare perspectives</h2>
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

            <SpotlightCard className="atlas-visit-panel" spotlightColor="rgba(229, 153, 52, 0.14)">
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
            </SpotlightCard>
          </div>
        )}

        {activeTab === "history" && (
          <div
            className="citylit-tab-panel"
            id={`${tabsId}-panel-history`}
            role="tabpanel"
            aria-labelledby={`${tabsId}-tab-history`}
          >
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
          <div
            className="citylit-tab-panel"
            id={`${tabsId}-panel-nearby`}
            role="tabpanel"
            aria-labelledby={`${tabsId}-tab-nearby`}
          >
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
          <div
            className="citylit-tab-panel"
            id={`${tabsId}-panel-tips`}
            role="tabpanel"
            aria-labelledby={`${tabsId}-tab-tips`}
          >
            <div className="citylit-tips-card">
              <h2>Practical Tips &amp; Access</h2>
              <MdxCallout
                tone={place.coordinateAccuracy === "venue" ? "tip" : "warning"}
                title={
                  place.coordinateAccuracy === "venue"
                    ? "Venue coordinate pin"
                    : "City-reference pin"
                }
              >
                <p>
                  {place.coordinateAccuracy === "venue"
                    ? "A venue pin is available; the entrance may differ. Confirm your arrival point with the operator."
                    : "The catalog has a city-reference pin. Maps searches the venue name and address; confirm the result before travelling."}
                </p>
              </MdxCallout>

              <MdxTable
                caption={`Sources & research · ${place.checkedAt}`}
                headers={["Source", "Checked", "Status"]}
                rows={place.sources.map((source) => [
                  <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                    {source.title} <ArrowUpRight size={12} />
                  </a>,
                  source.fetchedAt,
                  source.status === "fetched" ? "Source retrieved" : "Unavailable",
                ])}
              />
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
            const ok = !inDay ? handleToggleDay() : true;
            if (ok) benchoAudio.playConfirm();
            return ok;
          }}
          onReset={() => {
            if (!inDay || handleToggleDay()) benchoAudio.playClick(440);
          }}
        />
      </div>

      {/* Bencho Dynamic Island Toast */}
      <DynamicIslandToast message={message} onDismiss={() => setMessage("")} />
    </article>
  );
}
