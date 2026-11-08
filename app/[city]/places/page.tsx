import CityStage from "../../../components/CityStage";
import { stageCity, stageMetadata, type StageParams } from "../../../lib/stage-page";
export async function generateMetadata({ params }: { params: StageParams }) {
  return stageMetadata(params, "places");
}
export default async function Page({
  params,
  searchParams,
}: {
  params: StageParams;
  searchParams: Promise<{ place?: string }>;
}) {
  const [{ place }, city] = await Promise.all([searchParams, stageCity(params)]);
  return <CityStage city={city} mode="places" initialItem={place} />;
}
