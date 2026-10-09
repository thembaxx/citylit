import UiIcon from "../../../components/UiIcon";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReadingPage from "../../../components/ReadingPage";
import JsonLd from "../../../components/JsonLd";
import {
  provinces,
  cityPlaces,
  discoveryMetadata,
  discoverySchema,
  routeDescription,
  type DiscoveryRoute,
} from "../../../lib/seo";
import { categories, categorySlug } from "../../../lib/data";
type Props = { params: Promise<{ province: string }> };
export function generateStaticParams() {
  return provinces.map((province) => ({ province: province.slug }));
}
async function resolve({ params }: Props): Promise<DiscoveryRoute & { kind: "province" }> {
  const slug = (await params).province;
  const province = provinces.find((province) => province.slug === slug);
  if (!province) notFound();
  return { kind: "province", province, path: `/provinces/${province.slug}` };
}
export async function generateMetadata(props: Props) {
  return discoveryMetadata(await resolve(props));
}
export default async function ProvincePage(props: Props) {
  const route = await resolve(props);
  return (
    <ReadingPage>
      <JsonLd value={discoverySchema(route)} />
      <nav className="reading-links" aria-label="Breadcrumb">
        <Link href="/">South Africa</Link>
        <Link href="/destinations">City guides</Link>
        <span aria-current="page">{route.province.name}</span>
      </nav>
      <span className="tiny-label">A PROVINCE OF POSSIBILITIES</span>
      <h1>{route.province.name}</h1>
      <p className="reading-intro">{routeDescription(route)}</p>
      <div className="destination-grid">
        {route.province.cities.map((city) => (
          <article className="destination-card" key={city.slug}>
            <span className="tiny-label">{city.tag}</span>
            <h2>
              <Link href={`/${city.slug}`}>
                {city.name} <UiIcon name="arrow-up-right" />
              </Link>
            </h2>
            <p>{city.intro}</p>
            <nav className="reading-links" aria-label={`Available ${city.name} categories`}>
              {categories
                .filter((category) => cityPlaces(city).some((place) => place.category === category))
                .map((category) => (
                  <Link key={category} href={`/${city.slug}/${categorySlug(category)}?view=places`}>
                    {category}
                  </Link>
                ))}
            </nav>
          </article>
        ))}
      </div>
      <p>
        These chapters cover visitor destinations and surrounding districts. They are a researched
        starting point, not a complete directory of the province.
      </p>
      <Link href={`/guides/provinces/${route.province.slug}`} className="text-guide-link">
        Read the plain-text province guide
      </Link>
    </ReadingPage>
  );
}
