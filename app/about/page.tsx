import UiIcon from "../../components/UiIcon";
import Link from "next/link";
import ReadingPage from "../../components/ReadingPage";
import { MdxCallout, MdxCodeBlock, MdxSteps, MdxTable } from "../../components/ui/mdxcn";
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
      <MdxCallout tone="verified" title={`Catalog Snapshot · Checked ${latestCheck(places)}`}>
        <p>
          {places.length} researched places across {cities.length} South African destinations and{" "}
          {provinces.length} provinces. Retrieved records are editorial reference, not live
          confirmation of hours, prices, or ticket availability.
        </p>
      </MdxCallout>
      <section>
        <h2>How places are researched</h2>
        <MdxSteps
          items={[
            {
              title: "Verify primary records",
              description:
                "Cross-check official venue pages, Wikipedia CC BY-SA entries, and photographic attributions with explicit check dates.",
            },
            {
              title: "Separate pin precision",
              description:
                "Venue pins and broader city-reference pins are labelled separately so directions reflect true coordinate confidence.",
            },
            {
              title: "Draft corrections locally",
              description:
                "Suggested updates stay on your device until you choose to open a public GitHub issue with supporting sources.",
            },
          ]}
        />
      </section>
      <section>
        <h2>Confidence &amp; attribution matrix</h2>
        <MdxTable
          headers={["Label", "Meaning", "Licensing & Notes"]}
          rows={[
            [
              "Verified",
              "Supported by the cited source on the recorded check date",
              "Confirm opening hours directly with the operator",
            ],
            [
              "Editorial estimate",
              "Planning guidance such as typical dwell time or access notes",
              "Presented transparently as an estimate",
            ],
            [
              "Unknown",
              "Unconfirmed rather than free, open, or unavailable",
              "Flagged openly instead of filled with guesswork",
            ],
            [
              "Province boundaries",
              "geoBoundaries / OCHA / MDB administrative geometry",
              "Adapted under CC BY 3.0 IGO alongside MIT-licensed app code",
            ],
          ]}
        />
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
        <MdxCodeBlock
          title="Plain-text machine & reader endpoints"
          language="markdown"
          code={`# Citylit Plain-Text Catalog Index\nGET /llms.txt\nGET /guides/{city}\nGET /guides/{city}/{place}`}
        />
      </section>
      <Link href="/brand" className="text-guide-link">
        Meet Khwezi and the Citylit identity <UiIcon name="arrow-up-right" />
      </Link>
    </ReadingPage>
  );
}
