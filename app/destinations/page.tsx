import Link from "next/link";
import ReadingPage from "../../components/ReadingPage";
import JsonLd from "../../components/JsonLd";
import {
  provinces,
  cityPlaces,
  metadataForPage,
  discoverySchema,
  discoveryRoute,
} from "../../lib/seo";
export const metadata = metadataForPage(
  "South African city guides",
  "Browse twelve destinations across all nine South African provinces. Find researched places, landmarks, addresses, photographs and source links.",
  "/destinations",
);
export default function DestinationsPage() {
  const schema = discoverySchema({ ...discoveryRoute()!, path: "/destinations" });
  return (
    <ReadingPage>
      <JsonLd value={schema} />
      <span className="tiny-label">TWELVE DESTINATIONS / NINE PROVINCES</span>
      <h1>Find your next chapter.</h1>
      <p className="reading-intro">
        A country of little adventures. Choose a province, discover a city and follow a little
        curiosity.
      </p>
      {provinces.map((province) => (
        <section className="province-guide-section" key={province.slug}>
          <h2>
            <Link href={`/provinces/${province.slug}`}>{province.name} ↗</Link>
          </h2>
          <div className="destination-grid">
            {province.cities.map((city) => (
              <article className="destination-card" key={city.slug}>
                <span className="tiny-label">{city.tag}</span>
                <h3>
                  <Link href={`/${city.slug}`}>{city.name} ↗</Link>
                </h3>
                <p>{city.intro}</p>
                <span>{cityPlaces(city).length} researched discoveries</span>
                <Link className="text-guide-link" href={`/guides/${city.slug}`}>
                  Read the plain-text guide
                </Link>
              </article>
            ))}
          </div>
        </section>
      ))}
    </ReadingPage>
  );
}
