import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { landmarkSources } from "../lib/data";
import { type GuideCity } from "../lib/discovery-guide";
import GuideShell from "./GuideShell";
import Gallery from "./Gallery";

export default function LandmarkStory({ city, index }: { city: GuideCity; index: number }) {
  const name = city.landmarks[index];
  const record = landmarkSources.find((item) => item.name === name);
  return (
    <GuideShell>
      <div className="atlas-breadcrumb">
        <Link href={`/${city.slug}#landmarks`}>
          <ArrowLeft size={15} /> Back to {city.name}
        </Link>
      </div>
      <article className="atlas-landmark-story atlas-section">
        <p className="atlas-eyebrow">{city.province} / A LANDMARK STORY</p>
        <h1>
          {name}
          <span className="atlas-title-period">.</span>
        </h1>
        <p className="atlas-city-intro">{city.descriptions[index]}</p>
        {record?.images.length ? (
          <Gallery images={record.images} context="landmark" name={name} />
        ) : null}
        {record?.facts?.length ? (
          <dl className="atlas-story-facts">
            {record.facts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {record?.about && (
          <section className="atlas-story-about">
            <h2>
              The story <em>behind it.</em>
            </h2>
            <p>{record.about}</p>
            {record.aboutSource && (
              <a href={record.aboutSource} target="_blank" rel="noreferrer">
                Read the background on Wikipedia <ArrowUpRight size={14} />
              </a>
            )}
            {record.aboutLicense && (
              <p className="atlas-photo-credit">
                <a href={record.aboutLicense}>Wikipedia contributors · CC BY-SA 4.0 · excerpt</a>
              </p>
            )}
          </section>
        )}
        <div className="atlas-story-next">
          <h2>
            A spark for <em>your day.</em>
          </h2>
          <p>
            This is a landmark story. Current visiting hours, entry arrangements and accessibility
            have not been confirmed here.
          </p>
          <a
            className="atlas-button"
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ", " + city.name + ", South Africa")}`}
            target="_blank"
            rel="noreferrer"
          >
            Find the landmark on Maps <ArrowUpRight size={16} />
          </a>
          <Link href={`/${city.slug}#plan`} className="atlas-button atlas-primary">
            Plan a day in {city.short} <ArrowUpRight size={16} />
          </Link>
        </div>
      </article>
    </GuideShell>
  );
}
