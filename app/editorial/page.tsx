import EditorialDashboard from "../../components/EditorialDashboard";
import { metadataForPage } from "../../lib/seo";
export const metadata = metadataForPage(
  "Catalog review",
  "Citylit’s source quality review and browser-local correction drafts.",
  "/editorial",
  false,
);
export default function Page() {
  return <EditorialDashboard />;
}
