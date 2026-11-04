import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowUpRight,
  Compass,
  MapPin,
  CalendarBlank,
} from "@phosphor-icons/react/dist/ssr";
import { cities, landmarkSources } from "../lib/data";
import { landmarkPath, planningStops, type GuideCity } from "../lib/discovery-guide";
import GuideShell from "./GuideShell";
import { CityCard, PhotoCredit } from "./GuideCards";
import PlacesBrowser from "./PlacesBrowser";
import PlanVisit from "./PlanVisit";

export default function CityGuide({ city }: { city: GuideCity }) {
  const neighbours = cities.filter(
    (other) => other.slug !== city.slug && other.province === city.province,
  );
  const next = neighbours.length
    ? neighbours
    : cities
        .filter((other) => other.slug !== city.slug)
        .slice((cities.indexOf(city) + 1) % 9, ((cities.indexOf(city) + 1) % 9) + 2);
  return (
    <GuideShell>
      <div className="atlas-breadcrumb">
        <Link href="/destinations">
          <ArrowLeft size={15} /> All city guides
        </Link>
        <span>/</span>
        <Link href={`/provinces/${city.province.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
          {city.province}
        </Link>
      </div>
      <section className="atlas-city-hero atlas-city-map-hero">
        <div>
          <h1>
            {city.name}
            <span className="atlas-title-period">.</span>
          </h1>
          <p className="atlas-city-intro">{city.intro}</p>
          <div className="atlas-city-actions">
            <a href="#places" className="atlas-button atlas-primary">
              Explore places <ArrowUpRight size={18} />
            </a>
            <a href="#plan" className="atlas-button">
              <CalendarBlank size={18} /> Plan a visit
            </a>
          </div>
        </div>
      </section>
      <nav className="atlas-chapter-nav" aria-label={`${city.name} guide sections`}>
        <Link href={`/${city.slug}/landmarks`}>
          <Compass size={17} /> Landmarks
        </Link>
        <Link href={`/${city.slug}/places`}>
          <MapPin size={17} /> Places
        </Link>
      </nav>
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
              <article className="atlas-landmark-card" key={name}>
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
                    </div>
                  )}
                  <div>
                    <h3 id={`landmark-card-${city.slug}-${index}`}>
                      {name} <ArrowUpRight size={20} />
                    </h3>
                    <p>{city.descriptions[index] || record?.about?.split(". ")[0]}</p>
                  </div>
                </Link>
                {image && <PhotoCredit photo={image} />}
              </article>
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
