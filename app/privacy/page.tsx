import ReadingPage from "../../components/ReadingPage";
import { metadataForPage } from "../../lib/seo";
export const metadata = metadataForPage(
  "Privacy and your data",
  "How Citylit uses browser storage, optional location, offline downloads and third-party map requests. Your saved discoveries stay on your device.",
  "/privacy",
);
export default function PrivacyPage() {
  return (
    <ReadingPage>
      <span className="tiny-label">YOUR ADVENTURE / YOUR DEVICE</span>
      <h1>Privacy & data.</h1>
      <p className="reading-intro">
        Your discoveries belong to you. Here’s how the app handles them.
      </p>
      <section>
        <h2>Saved on this browser</h2>
        <p>
          Saved places, visits, itineraries, correction drafts, theme, touch-feedback preferences
          and welcome dismissal use browser storage. They are not synced to a Citylit account or
          database. Sound starts off on every reload. The service worker stores public guide text
          and downloaded photographs for offline use.
        </p>
        <p>
          You can remove these records using your browser’s site-data controls for
          citylit.vercel.app. This also removes offline downloads. Another person using the same
          browser profile can see the records.
        </p>
      </section>
      <section>
        <h2>Location is optional</h2>
        <p>
          Nearby discovery asks for browser location permission only when you choose that feature.
          Citylit calculates proximity on your device; the app does not submit your precise location
          to a Citylit backend. Approximate straight-line distances are not directions.
        </p>
      </section>
      <section>
        <h2>Maps, directions and source links</h2>
        <p>
          Place street maps request tiles from OpenStreetMap. The tile service receives normal
          network information, including your IP address, and the requested map area. Citylit does
          not cache street-map tiles for offline use.{" "}
          <a href="https://osmfoundation.org/wiki/Privacy_Policy">OpenStreetMap privacy policy</a>.
        </p>
        <p>
          Opening Google Maps, Apple Maps, Waze, Wikipedia, official venue websites or GitHub takes
          you to services with their own privacy policies. Itinerary share links contain public
          place identifiers and a destination. Share them only if you want those choices to be
          visible.
        </p>
      </section>
      <section>
        <h2>Hosting and measurement</h2>
        <p>
          The site is hosted by Vercel. Hosting may process network and security logs to deliver and
          protect the website.{" "}
          <a href="https://vercel.com/legal/privacy-policy">Vercel privacy policy</a>. The
          application does not currently install advertising trackers or send analytics events.
          Browser errors may appear in developer tools, and server errors may appear in hosting
          logs.
        </p>
      </section>
      <section>
        <h2>Questions and corrections</h2>
        <p>
          For technical questions, use{" "}
          <a href="https://github.com/thembaxx/citylit/issues/new/choose">
            the project’s public issue tracker
          </a>
          . Do not include private location, itineraries or other sensitive information in public
          issues.
        </p>
      </section>
    </ReadingPage>
  );
}
