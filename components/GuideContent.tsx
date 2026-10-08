import Link from "next/link";
import { categories, categorySlug } from "../lib/data";
import { cities, places } from "../lib/data";
import {
  cityPlaces,
  placeUrl,
  routeTitle,
  routeDescription,
  provinces,
  type DiscoveryRoute,
} from "../lib/seo";
import BrandWordmark from "./BrandWordmark";
import { evidenceNote } from "../lib/guides";

/** Readable, navigable counterpart of the game for browsers without JavaScript. */
export default function GuideContent({ route }: { route: DiscoveryRoute }) {
  const city = "city" in route ? route.city : undefined;
  const selected =
    route.kind === "place"
      ? [route.place]
      : route.kind === "category"
        ? route.places
        : city
          ? cityPlaces(city)
          : [];
  const destinations = route.kind === "province" ? route.province.cities : cities;
  return (
    <main className="guide-content" id="main-content" tabIndex={-1}>
      <Link href="/" aria-label="Citylit home">
        <BrandWordmark />
      </Link>
      <p className="tiny-label">SOUTH AFRICA / CITY GUIDES</p>
      <h1>{routeTitle(route)}</h1>
      <p className="reading-intro">{routeDescription(route)}</p>
      <nav className="reading-links" aria-label="Guide navigation">
        <Link href="/destinations">All destinations</Link>
        <Link href="/about">About the research</Link>
        <Link href="/privacy">Privacy & data</Link>
      </nav>
      <p>{evidenceNote}</p>
      {city ? (
        <>
          <h2>Explore {city.name}</h2>
          <ul>
            {categories
              .filter((category) =>
                places.some((place) => place.city === city.slug && place.category === category),
              )
              .map((category) => (
                <li key={category}>
                  <Link href={`/${city.slug}/${categorySlug(category)}?view=places`}>
                    {category}
                  </Link>
                </li>
              ))}
          </ul>
        </>
      ) : (
        <>
          <h2>City chapters</h2>
          <ul>
            {destinations.map((destination) => (
              <li key={destination.slug}>
                <Link href={`/${destination.slug}`}>{destination.name}</Link> ·{" "}
                {destination.province} — {destination.intro}
              </li>
            ))}
          </ul>
          {route.kind === "country" && (
            <>
              <h2>Provinces</h2>
              <ul>
                {provinces.map((province) => (
                  <li key={province.slug}>
                    <Link href={`/provinces/${province.slug}`}>{province.name}</Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
      {selected.length
        ? selected.map((place) => (
            <section key={place.id} className="reading-place">
              <h2>
                <Link href={placeUrl(place)}>{place.name}</Link>
              </h2>
              <p>{place.description}</p>
              <p>
                {place.address} · {city?.name}
              </p>
              {route.kind === "place" && (
                <>
                  <p>{place.about || place.description}</p>
                  {place.aboutSource && (
                    <p>
                      <a href={place.aboutSource}>About source</a>
                      {place.aboutLicense && (
                        <>
                          {" "}
                          ·{" "}
                          <a href={place.aboutLicense}>Wikipedia contributors · excerpt license</a>
                        </>
                      )}
                    </p>
                  )}
                  <h3>Practical facts</h3>
                  <ul>
                    {Object.entries(place.facts || {}).map(([key, fact]) => (
                      <li key={key}>
                        {key}:{" "}
                        {fact.value === null || fact.confidence === "unknown"
                          ? "Unconfirmed"
                          : String(fact.value)}{" "}
                        · {fact.confidence}
                        {fact.checkedAt && ` · checked ${fact.checkedAt}`}
                      </li>
                    ))}
                  </ul>
                  <p>
                    {place.coordinateAccuracy === "venue"
                      ? "A venue pin is available; the entrance may not be verified."
                      : "Only a city-reference pin is available. Confirm the venue address before navigating."}
                  </p>
                  {place.images.map((photo) => (
                    <p key={photo.src}>
                      <a href={photo.src}>{photo.alt}</a> ·{" "}
                      {place.imageContext === "city"
                        ? "City photograph, not the venue"
                        : "Venue photograph"}{" "}
                      · {photo.author} ·{" "}
                      <a href={photo.licenseUrl || photo.sourceUrl}>{photo.license}</a> ·{" "}
                      <a href={photo.sourceUrl}>Photo source</a>
                    </p>
                  ))}
                </>
              )}
              <p>
                <a href={place.website}>Official website</a>
                {place.wikipedia && (
                  <>
                    {" "}
                    · <a href={place.wikipedia}>Wikipedia</a>
                  </>
                )}
              </p>
              <details>
                <summary>Sources checked {place.checkedAt}</summary>
                <ul>
                  {place.sources.map((source) => (
                    <li key={source.url}>
                      <a href={source.url}>{source.title}</a> · fetched {source.fetchedAt} ·{" "}
                      {source.status}
                    </li>
                  ))}
                </ul>
              </details>
            </section>
          ))
        : route.kind === "category" && (
            <p>This chapter is still being researched. Try another available category.</p>
          )}
    </main>
  );
}
