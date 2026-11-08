import CityStage from "../../../components/CityStage";
import { stageCity, stageMetadata, type StageParams } from "../../../lib/stage-page";
export async function generateMetadata({ params }: { params: StageParams }) {
  return stageMetadata(params, "landmarks");
}
export default async function Page({
  params,
  searchParams,
}: {
  params: StageParams;
  searchParams: Promise<{ landmark?: string }>;
}) {
  const [{ landmark }, city] = await Promise.all([searchParams, stageCity(params)]);
  return <CityStage city={city} mode="landmarks" initialItem={landmark} />;
}
