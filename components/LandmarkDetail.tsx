"use client";
import { ArrowLeft, ArrowUpRight } from "@phosphor-icons/react";
import Gallery from "./Gallery";
import type { Photo } from "../lib/data";
import type { LandmarkFact, LandmarkVideo } from "./LandmarkSheet";

type Props = {
  city: string;
  province: string;
  name: string;
  description: string;
  about?: string;
  aboutHref?: string;
  facts?: LandmarkFact[];
  photos: Photo[];
  video?: LandmarkVideo;
  href?: string;
  onBack: () => void;
};

export default function LandmarkDetail({
  city,
  province,
  name,
  description,
  about,
  aboutHref,
  facts,
  photos,
  video,
  href,
  onBack,
}: Props) {
  return (
    <div className="detail-scroll">
      <article className="place-detail landmark-detail">
        <button className="detail-back" onClick={onBack}>
          <ArrowLeft size={16} weight="bold" />
          Back to {city}
        </button>
        {photos.length > 0 && <Gallery images={photos} context="landmark" name={name} />}
        <div className="detail-chips">
          <span>{city}</span>
          <span>{province}</span>
        </div>
        <h1>{name}</h1>
        <p className="detail-lead">{description}</p>
        {!!facts?.length && (
          <ul className="spot-facts">
            {facts.map((fact) => (
              <li key={fact.label}>
                <span>{fact.label}</span>
                {fact.value}
              </li>
            ))}
          </ul>
        )}
        {about && <p className="detail-lead">{about}</p>}
        {video && (
          <figure className="spot-film">
            <video controls playsInline preload="metadata" poster={photos[0]?.src}>
              <source src={video.src} />
            </video>
            <figcaption>
              {video.title} · {video.author} · {video.license}
            </figcaption>
          </figure>
        )}
        <div className="venue-links">
          {aboutHref && aboutHref !== href && (
            <a className="photo-link" href={aboutHref} target="_blank" rel="noreferrer">
              Background from Wikipedia <ArrowUpRight size={15} weight="bold" />
            </a>
          )}
          {href && (
            <a className="photo-link" href={href} target="_blank" rel="noreferrer">
              The story behind it <ArrowUpRight size={15} weight="bold" />
            </a>
          )}
        </div>
      </article>
    </div>
  );
}
