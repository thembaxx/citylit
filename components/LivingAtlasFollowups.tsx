import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BookmarkSimple, Compass, MapPin } from "@phosphor-icons/react";
import { cities, landmarkSources } from "../lib/data";
import { landmarkPath } from "../lib/discovery-guide";

const city = cities.find((item) => item.slug === "cape-town")!;
const landmark = landmarkSources.find((item) => item.name === "Table Mountain");

export default function LivingAtlasFollowups() {
  return (
    <>
      {landmark?.images[0] && (
        <section className="living-atlas-story" aria-label="A story to step into">
          <Link
            href={landmarkPath(city, landmark.name)}
            className="living-atlas-story-image"
            aria-label={`Read the story of ${landmark.name}`}
          >
            <Image
              src={landmark.images[0].src}
              alt={landmark.images[0].alt}
              fill
              sizes="(max-width: 700px) 88px, 112px"
            />
          </Link>
          <div>
            <p className="reference-eyebrow">A story to step into</p>
            <h2>{landmark.name}</h2>
            <p>See the city from its most unforgettable landmark.</p>
          </div>
          <Link href={landmarkPath(city, landmark.name)} className="living-atlas-story-link">
            Discover <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </section>
      )}

      <section
        className="reference-quick-links living-atlas-shortcuts"
        aria-label="More ways to explore"
      >
        <Link href="/destinations">
          <MapPin size={19} aria-hidden="true" /> Browse all cities{" "}
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
        <Link href="/explore?tab=day">
          <BookmarkSimple size={19} aria-hidden="true" /> Plan a day{" "}
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
        <Link href="/explore?tab=discover">
          <Compass size={19} aria-hidden="true" /> Browse places{" "}
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </section>
    </>
  );
}
