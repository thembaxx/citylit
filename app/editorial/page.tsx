import EditorialDashboard from "../../components/EditorialDashboard";
import { metadataForPage } from "../../lib/seo";
export const metadata = metadataForPage(
  "Catalog review",
  "Review Citylit source quality, manage correction drafts and prepare public reports for maintainers.",
  "/editorial",
  false,
);
export default function Page() {
  return <EditorialDashboard />;
}
