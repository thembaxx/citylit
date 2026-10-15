import Link from "next/link";
import { ArrowLeft, ArrowUpRight, MapPin } from "@phosphor-icons/react/dist/ssr";
import type { Place } from "../lib/data";
import { venuePath, type GuideCity } from "../lib/discovery-guide";
import GuideShell from "./GuideShell";
import Gallery from "./Gallery";
import PlaceContext from "./PlaceContext";
import PlaceActions from "./PlaceActions";
import SavePlace from "./SavePlace";

export default function VenueGuide({ city, place }: { city: GuideCity; place: Place }) {
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name}, ${place.address}, ${city.name}, South Africa`)}`;
  return (
    <GuideShell>
      <div className="atlas-breadcrumb">
        <Link href={`/${city.slug}#places`}>
          <ArrowLeft size={15} /> Back to {city.name}
        </Link>
        <span>/</span>
        <Link href={`/${city.slug}/${place.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
          {place.category}
        </Link>
      </div>
      <article className="atlas-venue atlas-section" key={place.id}>
        <header className="atlas-venue-heading">
          <div>
            <p className="atlas-eyebrow">
              {city.name} / {place.category}
            </p>
            <h1>
              {place.name}
              <span className="atlas-title-period">.</span>
            </h1>
            <p className="atlas-city-intro">{place.description}</p>
          </div>
          <SavePlace id={place.id} name={place.name} />
        </header>
        <div className="atlas-venue-columns">
          <div className="atlas-venue-story">
            <Gallery images={place.images} context={place.imageContext} name={place.name} />
            <PlaceContext place={place} />
          </div>
          <aside className="atlas-visit-panel" aria-labelledby="visit-panel-title">
            <p className="atlas-eyebrow">FROM CURIOSITY TO A DAY OUT</p>
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
            <p className="atlas-plan-note">
              {place.coordinateAccuracy === "venue"
                ? "A venue pin is available; the entrance may differ. Confirm your arrival point with the operator."
                : "The catalog has a city-reference pin. Maps searches the venue name and address; confirm the result before travelling."}
            </p>
            <PlaceActions place={place} />
            <details className="atlas-source-details">
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
            <Link className="atlas-text-link" href={`/explore?city=${city.slug}&tab=day`}>
              Open my day <ArrowUpRight size={16} />
            </Link>
          </aside>
        </div>
        <Link className="atlas-text-link" href={`${venuePath(place)}?view=3d`}>
          Open the original field guide <ArrowUpRight size={16} />
        </Link>
      </article>
    </GuideShell>
  );
}
