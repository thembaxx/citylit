export const categories = [
  "Entertainment",
  "Lodging",
  "Theatres",
  "Parks & zoos",
  "Clubs",
] as const;
export const cities = [
  {
    slug: "johannesburg",
    name: "Johannesburg",
    short: "Joburg",
    province: "Gauteng",
    tag: "The city of gold",
    intro: "Big energy. Bold ideas. A city that never stops becoming.",
    coords: [28.0473, -26.2041],
    landmarks: ["Ponte City", "Nelson Mandela Bridge", "Orlando Towers"],
  },
  {
    slug: "cape-town",
    name: "Cape Town",
    short: "Cape Town",
    province: "Western Cape",
    tag: "Between mountain & sea",
    intro: "Follow the mountain. Find your own kind of adventure.",
    coords: [18.4241, -33.9249],
    landmarks: ["Table Mountain", "Bo-Kaap", "Cape Point"],
  },
  {
    slug: "durban",
    name: "Durban",
    short: "Durban",
    province: "KwaZulu-Natal",
    tag: "Always a little warmer",
    intro: "Ocean air, colourful streets, and a rhythm all its own.",
    coords: [31.0218, -29.8587],
    landmarks: ["Moses Mabhida", "uShaka Marine World", "Umhlanga Lighthouse"],
  },
];
import sourcedPlaces from "../public/data/places.json";
import sourcedLandmarks from "../public/data/landmarks.json";
import sourcedCityImages from "../public/data/city-images.json";
export type Photo = {
  src: string;
  alt: string;
  author: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
  filename: string;
};
export type Place = {
  id: string;
  name: string;
  city: string;
  category: (typeof categories)[number];
  description: string;
  about?: string;
  aboutSource?: string;
  aboutLicense?: string;
  locationGroup?: string;
  goodToKnow?: { label: string; icon: "wifi" | "pool" | "fitness" | "info"; source: string }[];
  address: string;
  coords: number[];
  coordinateAccuracy: "venue" | "city";
  coordinateSource: string;
  website: string;
  wikipedia?: string;
  images: Photo[];
  imageContext: "venue" | "city";
  sources: { url: string; title: string; fetchedAt: string; status: string }[];
  checkedAt: string;
};
export const places = sourcedPlaces as Place[];
export const landmarkSources = sourcedLandmarks;
export const cityImages = sourcedCityImages as Record<string, Photo[]>;
export const categorySlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
