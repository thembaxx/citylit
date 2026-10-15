import { cities, cityImages, landmarkSources, places, categorySlug, type Place } from "./data";

export type GuideCity = (typeof cities)[number];
export const venuePath = (place: Place) =>
  `/${place.city}/${categorySlug(place.category)}/${place.id}`;
const landmarkAliases: Record<string, string> = {
  "durban/moses-mabhida": "moses-mabhida-stadium",
  "pretoria/state-theatre": "south-african-state-theatre",
  "stellenbosch/village-museum": "stellenbosch-village-museum",
  "stellenbosch/stellenbosch-botanical-garden": "stellenbosch-university-botanical-garden",
  "pietermaritzburg/kzn-botanical-garden": "kwazulu-natal-national-botanical-garden",
  "gqeberha/boardwalk": "boardwalk-hotel",
  "bloemfontein/oliewenhuis": "oliewenhuis-art-museum",
  "bloemfontein/free-state-botanical-garden": "free-state-national-botanical-garden",
  "mbombela/lowveld-botanical-garden": "lowveld-national-botanical-garden",
  "polokwane/bakone-malapa": "bakone-malapa-open-air-museum",
  "polokwane/meropa": "meropa-hotel",
  "mahikeng/game-reserve": "mafikeng-game-reserve",
  "mahikeng/mmabatho-palms": "mmabatho-palms-hotel",
};
export function landmarkVenue(city: string, name: string) {
  const normalized = categorySlug(name);
  return places.find(
    (place) =>
      place.city === city &&
      (place.id === landmarkAliases[`${city}/${normalized}`] ||
        categorySlug(place.name) === normalized ||
        categorySlug(place.name) === normalized + "-museum" ||
        place.id === normalized),
  );
}
export function landmarkPath(city: GuideCity, name: string) {
  const place = landmarkVenue(city.slug, name);
  return place ? venuePath(place) : `/${city.slug}?landmark=${categorySlug(name)}`;
}
export function cityPhoto(city: GuideCity) {
  return (
    cityImages[city.slug]?.[0] ||
    landmarkSources.find((record) => city.landmarks.includes(record.name))?.images[0]
  );
}
export function planningStops(city: string) {
  const local = places.filter(
    (place) => place.city === city && place.category !== "Lodging" && place.category !== "Clubs",
  );
  const nature = local.find((place) => place.category === "Parks & zoos");
  const culture = local.find((place) => place.category === "Entertainment");
  const extra = local.find((place) => place.id !== nature?.id && place.id !== culture?.id);
  return [nature, culture, extra].filter((place): place is Place => !!place);
}
