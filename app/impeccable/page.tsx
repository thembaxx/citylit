import type { Metadata } from "next";
import ImpeccableLanding from "./ImpeccableLanding";
import "./impeccable.css";

export const metadata: Metadata = {
  title: "Impeccable — The missing design vocabulary for agents",
  description:
    "A faithful, interactive study of the Impeccable landing page: before/after command proof, slop detection, design directions and install flow.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ImpeccableLanding />;
}
