import GuideShell from "../../components/GuideShell";
import CityDirectory from "../../components/CityDirectory";
import JsonLd from "../../components/JsonLd";
import { metadataForPage, discoverySchema, discoveryRoute } from "../../lib/seo";
export const metadata = metadataForPage(
  "South African city guides",
  "Browse twelve destinations across all nine South African provinces. Find researched places, landmarks, addresses, photographs and source links.",
  "/destinations",
);
export default function DestinationsPage() {
  const schema = discoverySchema({ ...discoveryRoute()!, path: "/destinations" });
  return (
    <GuideShell>
      <JsonLd value={schema} />
      <header className="atlas-directory-header atlas-section">
        <p className="atlas-eyebrow">12 CITIES · 9 PROVINCES</p>
        <h1>Find your next chapter.</h1>
      </header>
      <CityDirectory />
    </GuideShell>
  );
}
