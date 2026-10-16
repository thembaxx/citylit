import { notFound } from "next/navigation";
import { cities } from "./data";
import { metadataForPage } from "./seo";
export type StageParams = Promise<{ city: string }>;
export async function stageCity(params: StageParams) {
  const { city: slug } = await params;
  const city = cities.find((row) => row.slug === slug);
  if (!city) notFound();
  return city;
}
export async function stageMetadata(params: StageParams, mode: "landmarks" | "places") {
  const city = await stageCity(params);
  return metadataForPage(
    `${city.name} ${mode} in 3D`,
    `Explore ${city.name}'s ${mode} on an interactive model stage, open researched visitor guides and build your day.`,
    `/${city.slug}/${mode}`,
    false,
  );
}
