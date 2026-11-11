import type { Place } from "../lib/data";
import { type GuideCity } from "../lib/discovery-guide";
import GuideShell from "./GuideShell";
import VenueDetailView from "./VenueDetailView";

export default function VenueGuide({ city, place }: { city: GuideCity; place: Place }) {
  return (
    <GuideShell>
      <VenueDetailView city={city} place={place} />
    </GuideShell>
  );
}
