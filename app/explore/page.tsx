import { Suspense } from "react";
import AdventureHub from "../../components/AdventureHub";
import KhweziMoment from "../../components/KhweziMoment";
import { metadataForPage } from "../../lib/seo";
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
export async function generateMetadata({ searchParams }: Props) {
  const query = await searchParams;
  return metadataForPage(
    "Plan a day in South Africa",
    "Find a little adventure, collect discoveries and plan a day across twelve South African destinations. Saved plans stay in your browser.",
    "/explore",
    !query.trip &&
      !query.q &&
      !query.tab &&
      !query["shared-url"] &&
      !query["shared-text"] &&
      !query["shared-title"],
  );
}
export default async function Page({ searchParams }: Props) {
  // Resolve query state before streaming so the planner also has useful server HTML.
  await searchParams;
  return (
    <Suspense
      fallback={
        <div className="brand-route-loading" role="status">
          <KhweziMoment pose="loading" />
        </div>
      }
    >
      <AdventureHub />
    </Suspense>
  );
}
