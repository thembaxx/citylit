import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowUpRight,
  Compass,
  MapPin,
  CalendarBlank,
} from "@phosphor-icons/react/dist/ssr";
import { cities, places, landmarkSources } from "../lib/data";
import { cityPhoto, landmarkPath, planningStops, type GuideCity } from "../lib/discovery-guide";
import GuideShell from "./GuideShell";
import { CityCard, PhotoCredit } from "./GuideCards";
import PlacesBrowser from "./PlacesBrowser";
import PlanVisit from "./PlanVisit";

export default function CityGuide({ city }: { city: GuideCity }) {
  const photo = cityPhoto(city);
  const local = places.filter((place) => place.city === city.slug);
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
      <section className="atlas-city-hero">
        <div>
          <p className="atlas-eyebrow">
            {city.tag} / CHAPTER {String(cities.indexOf(city) + 1).padStart(2, "0")}
          </p>
          <h1>
            {city.name}
            <span className="atlas-title-period">.</span>
          </h1>
          <p className="atlas-city-intro">{city.intro}</p>
          <div className="atlas-city-actions">
            <a href="#places" className="atlas-button atlas-primary">
              Discover the city <ArrowUpRight size={18} />
            </a>
            <a href="#plan" className="atlas-button">
              <CalendarBlank size={18} /> Plan a visit
            </a>
          </div>
        </div>
        {photo && (
          <figure className="atlas-city-hero-photo">
            <div>
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(max-width: 768px) 92vw, 47vw"
                preload
              />
            </div>
            <PhotoCredit photo={photo} city />
          </figure>
        )}
      </section>
      <div className="atlas-city-facts">
        <div>
          <span>CALL IT HOME</span>
          <Link href={`/provinces/${city.province.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
            {city.province} <ArrowUpRight size={14} />
          </Link>
        </div>
        <div>
          <span>THE SKYLINE</span>
          <strong>{city.landmarks.length} landmark stories</strong>
        </div>
        <div>
          <span>FOLLOW A LITTLE CURIOSITY</span>
          <strong>{local.length} places to discover</strong>
        </div>
      </div>
      <nav className="atlas-chapter-nav" aria-label={`${city.name} guide sections`}>
        <a href="#landmarks">
          <Compass size={17} /> Landmarks
        </a>
        <a href="#places">
          <MapPin size={17} /> Places worth visiting
        </a>
        <a href="#plan">
          <CalendarBlank size={17} /> Plan a day
        </a>
        <Link href={`/${city.slug}?view=3d`}>
          Explore in 3D <ArrowUpRight size={15} />
        </Link>
      </nav>
      <section className="atlas-section" id="landmarks" aria-labelledby="landmarks-title">
        <div className="atlas-section-heading">
          <div>
            <p className="atlas-eyebrow">GET TO KNOW THE SKYLINE</p>
            <h2 id="landmarks-title">
              Every landmark
              <br />
              has <em>a story.</em>
            </h2>
          </div>
          <p>
            The shapes you recognise.
            <br />
            The stories you haven’t heard.
          </p>
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
                    <span className="atlas-eyebrow">
                      LANDMARK / {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 id={`landmark-card-${city.slug}-${index}`}>
                      {name} <ArrowUpRight size={20} />
                    </h3>
                    <p>{city.descriptions[index] || record?.about?.split(". ")[0]}</p>
                    <span className="atlas-text-link">
                      Discover the story <ArrowUpRight size={15} />
                    </span>
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
            <p className="atlas-eyebrow">BEYOND THE POSTCARD</p>
            <h2 id="places-title">
              Find your kind
              <br />
              of <em>somewhere.</em>
            </h2>
          </div>
          <p>
            Art, green spaces, a good night’s sleep.
            <br />
            Make a little room for discovery.
          </p>
        </div>
        <PlacesBrowser city={city.slug} />
      </section>
      <PlanVisit city={city.slug} cityName={city.name} stops={planningStops(city.slug)} />
      <section className="atlas-section atlas-neighbours">
        <div className="atlas-section-heading">
          <div>
            <p className="atlas-eyebrow">CURIOSITY DOESN’T STOP HERE</p>
            <h2>
              Keep <em>exploring.</em>
            </h2>
          </div>
          <Link href="/destinations" className="atlas-text-link">
            All twelve guides <ArrowUpRight size={17} />
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
