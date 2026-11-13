"use client";

import { useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  BookmarkSimple,
  Cube,
  MapPin,
  ShareNetwork,
} from "@phosphor-icons/react";
import { landmarkSources } from "../lib/data";
import { landmarkVenue, togglePlaceInDay, type GuideCity } from "../lib/discovery-guide";
import GuideShell from "./GuideShell";
import Gallery from "./Gallery";
import SlideToConfirm from "./ui/SlideToConfirm";
import DynamicIslandToast from "./ui/DynamicIslandToast";
import LiquidTabs from "./ui/LiquidTabs";
import ReaderCard from "./ui/ReaderCard";
import { MdxCallout, MdxCodeBlock, MdxTable } from "./ui/mdxcn";
import { useDiscovery } from "./useDiscovery";
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
  const tabsId = useId();

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
    const result = togglePlaceInDay(place, state.itinerary, update);
    setMessage(result.message);
    return result.ok;
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
              <MapPin size={12} weight="fill" /> Heritage Landmark
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
              {record?.facts?.[0] && (
                <div className="citylit-detail-rating">
                  <span>
                    {record.facts[0].label}: {record.facts[0].value}
                  </span>
                </div>
              )}
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
        <div className="citylit-detail-tabs-wrap">
          <LiquidTabs
            variant="folder"
            ariaLabel="Landmark sections"
            idPrefix={`${tabsId}-tab`}
            panelIdPrefix={`${tabsId}-panel`}
            value={activeTab}
            onChange={(id) => {
              benchoAudio.playTap(780);
              setActiveTab(id as "overview" | "history" | "facts" | "sources");
            }}
            items={[
              { id: "overview", label: "Overview" },
              { id: "history", label: "History" },
              { id: "facts", label: "Facts" },
              { id: "sources", label: "Sources" },
            ]}
          />
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
              <p className="citylit-lead-desc">{city.descriptions[index]}</p>
              {record?.images.length ? (
                <Gallery images={record.images} context="landmark" name={name} />
              ) : null}
            </div>
          )}

          {activeTab === "history" && (
            <div
              className="citylit-tab-panel"
              id={`${tabsId}-panel-history`}
              role="tabpanel"
              aria-labelledby={`${tabsId}-tab-history`}
            >
              {record?.about ? (
                <div className="citylit-history-reader-stack">
                  <ReaderCard
                    title={name}
                    subtitle={`The story behind ${name} in ${city.name}, ${city.province}`}
                    category="Landmark Monograph"
                    excerpt={record.about}
                    fullText={record.about}
                  />
                  {record.aboutSource && (
                    <a
                      className="citylit-source-attribution-link"
                      href={record.aboutSource}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Read background on Wikipedia <ArrowUpRight size={14} />
                    </a>
                  )}
                </div>
              ) : (
                <p>Detailed historical monographs are being compiled for this landmark.</p>
              )}
            </div>
          )}

          {activeTab === "facts" && (
            <div
              className="citylit-tab-panel"
              id={`${tabsId}-panel-facts`}
              role="tabpanel"
              aria-labelledby={`${tabsId}-tab-facts`}
            >
              {record?.facts?.length ? (
                <MdxTable
                  caption={`${name} · Reference facts`}
                  headers={["Attribute", "Detail"]}
                  rows={record.facts.map((fact) => [fact.label, fact.value])}
                />
              ) : (
                <MdxCallout tone="tip" title="Practical access">
                  <p>Public entry and visiting hours are verified through local operators.</p>
                </MdxCallout>
              )}
            </div>
          )}

          {activeTab === "sources" && (
            <div
              className="citylit-tab-panel"
              id={`${tabsId}-panel-sources`}
              role="tabpanel"
              aria-labelledby={`${tabsId}-tab-sources`}
            >
              <MdxCallout tone="verified" title="Research & attribution">
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
              </MdxCallout>
              <MdxCodeBlock
                title="Portable Markdown Note"
                language="markdown"
                code={`# ${name}\n- Destination: ${city.name}, ${city.province}\n- Summary: ${city.descriptions[index]}\n${record?.aboutSource ? `- Source: ${record.aboutSource}` : ""}`.trim()}
              />
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
                const ok = !inDay ? handleToggleDay() : true;
                if (ok) benchoAudio.playConfirm();
                return ok;
              }}
              onReset={() => {
                if (!inDay || handleToggleDay()) benchoAudio.playClick(440);
              }}
            />
          </div>
        )}

        <DynamicIslandToast message={message} onDismiss={() => setMessage("")} />
      </article>
    </GuideShell>
  );
}
