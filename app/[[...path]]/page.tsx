import { notFound } from "next/navigation";
import Explorer from "../../components/Explorer";
import type { Metadata } from "next";
import { discoveryRoute, discoveryMetadata, discoverySchema } from "../../lib/seo";
import JsonLd from "../../components/JsonLd";
import GuideContent from "../../components/GuideContent";
type Props = {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const route = discoveryRoute((await params).path);
  if (!route) notFound();
  const query = await searchParams;
  const filtered = ["q", "filters", "district", "trip"].some((key) => Boolean(query[key]?.length));
  return discoveryMetadata(route, filtered);
}
export default async function Page({ params }: Props) {
  const { path = [] } = await params;
  const route = discoveryRoute(path);
  if (!route) notFound();
  return (
    <>
      <JsonLd value={discoverySchema(route)} />
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
