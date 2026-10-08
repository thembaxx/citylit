import type { Metadata } from "next";
import BrandStudio from "../../components/BrandStudio";
export const metadata: Metadata = {
  title: "Meet Khwezi — Citylit brand field notes",
  description: "The Citylit identity, a curious springhare and little moments of discovery.",
};
export default function Page() {
  return <BrandStudio />;
}
