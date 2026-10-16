import CityStage from "../../../components/CityStage";
import { stageCity, stageMetadata, type StageParams } from "../../../lib/stage-page";
export async function generateMetadata({ params }: { params: StageParams }) {
  return stageMetadata(params, "landmarks");
}
export default async function Page({ params }: { params: StageParams }) {
  return <CityStage city={await stageCity(params)} mode="landmarks" />;
}
