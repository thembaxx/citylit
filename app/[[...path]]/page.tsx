import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Explorer from "../../components/Explorer";
import type { Metadata } from "next";
import { discoveryRoute, discoveryMetadata, discoverySchema } from "../../lib/seo";
import JsonLd from "../../components/JsonLd";
import GuideContent from "../../components/GuideContent";
import DiscoveryHome from "../../components/DiscoveryHome";
import CityGuide from "../../components/CityGuide";
import VenueGuide from "../../components/VenueGuide";
import LandmarkStory from "../../components/LandmarkStory";
import GuideShell from "../../components/GuideShell";
import PlacesBrowser from "../../components/PlacesBrowser";
import Link from "next/link";
import { categorySlug, categoryBlurbs } from "../../lib/data";
import ExperiencePreference from "../../components/ExperiencePreference";
type Props = {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const route = discoveryRoute((await params).path);
  if (!route) notFound();
  const query = await searchParams;
  if (
    route.kind === "city" &&
    query.landmark &&
    (typeof query.landmark !== "string" ||
      !route.city.landmarks.some((name) => categorySlug(name) === query.landmark))
  )
    notFound();
  const filtered = [
    "q",
    "filters",
    "district",
    "trip",
    "landmark",
    "view",
    "category",
    "province",
  ].some((key) => Boolean(query[key]?.length));
  return discoveryMetadata(route, filtered);
}
export default async function Page({ params, searchParams }: Props) {
  const { path = [] } = await params;
  const route = discoveryRoute(path);
  if (!route) notFound();
  const query = await searchParams;
  const preferred = (await cookies()).get("citylit-view")?.value;
  const use3d = query.view === "3d" || (query.view !== "guide" && preferred === "3d");
  const preference =
    query.view === "3d" || query.view === "guide" ? (
      <ExperiencePreference view={query.view} />
    ) : null;
  if (!use3d) {
    let content;
    if (route.kind === "country") content = <DiscoveryHome />;
    else if (route.kind === "city") {
      const index =
        typeof query.landmark === "string"
          ? route.city.landmarks.findIndex((name) => categorySlug(name) === query.landmark)
          : -1;
      if (query.landmark && index < 0) notFound();
      content =
        index >= 0 ? (
          <LandmarkStory city={route.city} index={index} />
        ) : (
          <CityGuide city={route.city} />
        );
    } else if (route.kind === "place")
      content = <VenueGuide city={route.city} place={route.place} />;
    else if (route.kind === "category")
      content = (
        <GuideShell>
          <section className="atlas-section atlas-category-guide">
            <Link href={`/${route.city.slug}#places`} className="atlas-text-link">
              ← Back to {route.city.name}
            </Link>
            <p className="atlas-eyebrow">{route.city.name} / CITY GUIDE</p>
            <h1>
              {route.category}
              <span className="atlas-title-period">.</span>
            </h1>
            <p className="atlas-city-intro">{categoryBlurbs[route.category]}</p>
            <PlacesBrowser
              key={route.path}
              city={route.city.slug}
              initialCategory={route.category}
            />
          </section>
        </GuideShell>
      );
    return (
      <>
        <JsonLd value={discoverySchema(route)} />
        {preference}
        {content}
      </>
    );
  }
  return (
    <>
      <JsonLd value={discoverySchema(route)} />
      {preference}
      <Explorer />
      <noscript>
        <style>{".game-screen { display: none !important; }"}</style>
        <div className="no-script-guide">
          <GuideContent route={route} />
        </div>
      </noscript>
    </>
  );
}
