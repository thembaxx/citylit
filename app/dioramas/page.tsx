import GuideShell from "../../components/GuideShell";
import DioramaExperience from "../../components/DioramaExperience";
import { metadataForPage } from "../../lib/seo";
import "./dioramas.css";

export const metadata = metadataForPage(
  "South African landscapes in 3D",
  "Explore fourteen South African places — from the Hole in the Wall to Augrabies Falls — as animated cutaway dioramas. Orbit the scene, change the light, open the earth, and switch between WebGPU and WebGL 2.",
  "/dioramas",
);

export default function DioramasPage() {
  return (
    <GuideShell stage>
      <DioramaExperience />
    </GuideShell>
  );
}
