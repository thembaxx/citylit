import Link from "next/link";
import ReadingPage from "../../components/ReadingPage";
import { metadataForPage, latestCheck, provinces } from "../../lib/seo";
import { cities, places } from "../../lib/data";
export const metadata = metadataForPage(
  "About Citylit and its sources",
  "How Citylit researches South African places, labels data confidence and credits Wikipedia, photographs and geographic sources.",
  "/about",
);
export default function AboutPage() {
  return (
    <ReadingPage>
      <span className="tiny-label">CURIOUS BY DESIGN / CAREFUL WITH FACTS</span>
      <h1>Every city has a spark.</h1>
      <p className="reading-intro">
        Citylit turns discovering South Africa into a little adventure. Khwezi brings the
        personality. Sources keep the story grounded.
      </p>
      <section>
        <h2>Our starting point</h2>
        <p>
          Our catalog includes {places.length} places across {cities.length} destinations and all{" "}
          {provinces.length} provinces. Chapters represent visitor destinations and surrounding
          districts. Coverage is curated and incomplete; an empty category means it hasn’t been
          researched yet.
        </p>
        <p>
          The most recent catalog source check is {latestCheck(places)}. A retrieved page is not
          live confirmation of opening hours, ticket availability or amenities.
        </p>
      </section>
      <section>
        <h2>What we know, and what we don’t</h2>
        <p>
          Practical facts carry a source, check date and confidence. Verified means supported by the
          cited source at that date. Editorial estimates help with planning and remain estimates.
          Unknown means unconfirmed, rather than unavailable or free.
        </p>
        <p>
          We label city-reference pins separately from venue pins. A venue pin does not guarantee a
          verified entrance. City-atmosphere photographs are labelled and do not claim to show the
          venue.
        </p>
      </section>
      <section>
        <h2>Sources and credits</h2>
        <p>
          Place pages link to official websites, Wikipedia and the sources used for research.
          Wikipedia excerpts retain their linked CC BY-SA license. Photographs carry individual
          author, source and license credits. The province map uses{" "}
          <a href="https://www.geoboundaries.org/api/current/gbOpen/ZAF/ADM1/">
            geoBoundaries / OCHA / MDB
          </a>
          , adapted under CC BY 3.0 IGO.
        </p>
        <p>
          Citylit’s source code is MIT licensed. That license does not replace the separate licenses
          of photographs, Wikipedia excerpts, fonts or geographic data.
        </p>
      </section>
      <section>
        <h2>Corrections and contact</h2>
        <p>
          Use “Suggest a correction” on a place page to prepare a draft on your device. A draft does
          not update the public catalog and is not sent automatically. For a public correction or
          technical issue,{" "}
          <a href="https://github.com/thembaxx/citylit/issues/new/choose">open a GitHub issue</a>{" "}
          with the place link and supporting source. Avoid including personal or sensitive
          information in a public issue.
        </p>
      </section>
      <section>
        <h2>For readers and AI search</h2>
        <p>
          Our <Link href="/destinations">city guides</Link> have readable HTML and{" "}
          <a href="/llms.txt">plain-text references</a> built from the same catalog as the app. Cite
          the place page and underlying source, keep uncertainty intact, and check the venue before
          relying on changing details.
        </p>
      </section>
      <Link href="/brand" className="text-guide-link">
        Meet Khwezi and the Citylit identity ↗
      </Link>
    </ReadingPage>
  );
}
