import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, MapPin } from "@phosphor-icons/react/dist/ssr";
import { cityPhoto, venuePath, type GuideCity } from "../lib/discovery-guide";
import { places, type Place, type Photo } from "../lib/data";

export function PhotoCredit({ photo, city = false }: { photo: Photo; city?: boolean }) {
  return (
    <span className="atlas-photo-credit">
      {city ? "City atmosphere · " : ""}
      <a href={photo.sourceUrl} target="_blank" rel="noreferrer">
        {photo.author || "Wikimedia Commons"}
      </a>{" "}
      ·{" "}
      <a href={photo.licenseUrl || photo.sourceUrl} target="_blank" rel="noreferrer">
        {photo.license}
      </a>
    </span>
  );
}
export function CityCard({ city, index }: { city: GuideCity; index: number }) {
  const photo = cityPhoto(city);
  return (
    <article className="atlas-city-card">
      <Link
        href={`/${city.slug}`}
        className="atlas-city-card-link"
        aria-labelledby={`city-card-${city.slug}`}
      >
        <div className="atlas-city-photo">
          {photo && (
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 30vw"
            />
          )}
          <span className="atlas-card-number">{String(index + 1).padStart(2, "0")} / 12</span>
          <span className="atlas-card-arrow">
            <ArrowUpRight size={22} />
          </span>
        </div>
        <div className="atlas-card-copy">
          <p className="atlas-eyebrow">{city.province}</p>
          <h3 id={`city-card-${city.slug}`}>{city.name}</h3>
          <p>{city.intro}</p>
          <span className="atlas-card-meta">
            {places.filter((place) => place.city === city.slug).length} places to discover
          </span>
        </div>
      </Link>
      {photo && <PhotoCredit photo={photo} city />}
    </article>
  );
}
export function PlaceCard({ place }: { place: Place }) {
  const photo = place.images[0];
  return (
    <article className="atlas-place-card">
      <Link
        href={venuePath(place)}
        className="atlas-place-card-link"
        aria-labelledby={`place-card-${place.id}`}
      >
        {photo && (
          <div className="atlas-place-photo">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 30vw"
            />
            <span className="atlas-card-arrow">
              <ArrowUpRight size={20} />
            </span>
          </div>
        )}
        <div className="atlas-card-copy">
          <p className="atlas-eyebrow">{place.category}</p>
          <h3 id={`place-card-${place.id}`}>{place.name}</h3>
          <p>{place.description}</p>
          <span className="atlas-card-meta">
            <MapPin size={14} aria-hidden="true" /> {place.district || place.address}
          </span>
        </div>
      </Link>
      {photo && <PhotoCredit photo={photo} city={place.imageContext === "city"} />}
    </article>
  );
}
