import BrandStudio from "../../components/BrandStudio";
import { metadataForPage } from "../../lib/seo";
export const metadata = metadataForPage(
  "Meet Khwezi — brand field notes",
  "The Citylit identity, a curious springhare and little moments of discovery.",
  "/brand",
);
export default function Page() {
  return <BrandStudio />;
}
