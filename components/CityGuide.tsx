import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight, Cube, MapPin } from "@phosphor-icons/react/dist/ssr";
import { cities, landmarkSources, places } from "../lib/data";
import { cityPhoto, landmarkPath, planningStops, type GuideCity } from "../lib/discovery-guide";
import GuideShell from "./GuideShell";
import { CityCard, PhotoCredit } from "./GuideCards";
import PlacesBrowser from "./PlacesBrowser";
import PlanVisit from "./PlanVisit";
import TiltCard from "./ui/TiltCard";
import WeatherWidget from "./WeatherWidget";

export default function CityGuide({ city }: { city: GuideCity }) {
  const neighbours = cities.filter(
    (other) => other.slug !== city.slug && other.province === city.province,
  );
  const next = neighbours.length
    ? neighbours
    : cities
        .filter((other) => other.slug !== city.slug)
        .slice((cities.indexOf(city) + 1) % 9, ((cities.indexOf(city) + 1) % 9) + 2);
  const photo = cityPhoto(city);
  const placeCount = places.filter((place) => place.city === city.slug).length;
  return (
    <GuideShell>
      <div className="atlas-breadcrumb atlas-city-breadcrumb">
        <Link href="/destinations">
          <ArrowLeft size={15} /> All city guides
        </Link>
        <span>/</span>
        <Link href={`/provinces/${city.province.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
          {city.province}
        </Link>
      </div>
      <section className="atlas-city-hero atlas-city-map-hero atlas-city-hero-redesign">
        <div className="atlas-city-hero-copy">
          <p className="atlas-eyebrow">{city.province} · CITY GUIDE</p>
          <WeatherWidget name={city.name} longitude={city.coords[0]} latitude={city.coords[1]} />
          <h1>
            {city.name}
            <span className="atlas-title-period">.</span>
          </h1>
          <p className="atlas-city-intro">{city.intro}</p>
          <p className="atlas-city-inventory">
            <span>{city.landmarks.length} landmarks</span>
            <span aria-hidden="true">·</span>
            <span>{placeCount} researched places</span>
          </p>
          <div className="atlas-city-actions">
            <Link
              href={`/${city.slug}/landmarks`}
              className="atlas-button atlas-primary"
              data-transition-label={`${city.name} landmarks`}
            >
              Explore in 3D <ArrowUpRight size={18} />
            </Link>
            <a href="#places" className="atlas-text-link atlas-city-secondary-action">
              Find a place <MapPin size={18} />
            </a>
          </div>
        </div>
        {photo && (
          <div className="atlas-city-hero-art" aria-label={`Photograph from ${city.name}`}>
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              priority
              sizes="(max-width: 760px) 100vw, 48vw"
            />
            <PhotoCredit photo={photo} />
          </div>
        )}
      </section>
      <section className="atlas-section" id="landmarks" aria-labelledby="landmarks-title">
        <div className="atlas-section-heading">
          <div>
            <h2 id="landmarks-title">Landmarks</h2>
          </div>
        </div>
        <div className="atlas-landmark-grid">
          {city.landmarks.map((name, index) => {
            const record = landmarkSources.find((item) => item.name === name);
            const image = record?.images[0];
            return (
              <TiltCard className="atlas-landmark-card" key={name} maxTilt={2.6}>
                <Link
                  className="atlas-landmark-link"
                  href={landmarkPath(city, name)}
                  aria-labelledby={`landmark-card-${city.slug}-${index}`}
                >
                  {image && (
                    <div className="atlas-landmark-photo">
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        sizes="(max-width:640px) 86vw, 29vw"
                      />
                      <span className="atlas-landmark-3d-tag" aria-hidden="true">
                        <Cube size={13} weight="duotone" /> 3D
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 id={`landmark-card-${city.slug}-${index}`}>
                      {name} <ArrowUpRight size={20} />
                    </h3>
                    <p aria-hidden="true">
                      {city.descriptions[index] || record?.about?.split(". ")[0]}
                    </p>
                  </div>
                </Link>
                {image && <PhotoCredit photo={image} />}
              </TiltCard>
            );
          })}
        </div>
      </section>
      <section className="atlas-section" id="places" aria-labelledby="places-title">
        <div className="atlas-section-heading">
          <div>
            <h2 id="places-title">Places</h2>
          </div>
        </div>
        <PlacesBrowser city={city.slug} />
      </section>
      <PlanVisit city={city.slug} cityName={city.name} stops={planningStops(city.slug)} />
      <section className="atlas-section atlas-neighbours">
        <div className="atlas-section-heading">
          <div>
            <h2>Nearby cities</h2>
          </div>
          <Link href="/destinations" className="atlas-text-link">
            All cities <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="atlas-city-grid">
          {next.map((other) => (
            <CityCard key={other.slug} city={other} index={cities.indexOf(other)} />
          ))}
        </div>
      </section>
    </GuideShell>
  );
}
