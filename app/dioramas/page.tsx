import GuideShell from "../../components/GuideShell";
import DioramaExperience from "../../components/DioramaExperience";
import { metadataForPage } from "../../lib/seo";
import "./dioramas.css";

export const metadata = metadataForPage(
  "South African landscapes in 3D",
  "Explore Soweto, the Drakensberg, Pretoria and Knysna as animated cutaway dioramas. Orbit the scene, change the light and open the earth to see each place in layers.",
  "/dioramas",
);

export default function DioramasPage() {
  return (
    <GuideShell stage>
      <DioramaExperience />
    </GuideShell>
  );
}
