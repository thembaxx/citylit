import { places, categorySlug } from "./data";
import { publicHttpsUrl } from "./client-data";
/** OS shares resolve only to a known catalog place; they never trigger remote URL fetching. */
export function sharedPlace(value: string | null) {
  if (!publicHttpsUrl(value)) return undefined;
  const url = new URL(value);
  if (url.origin === "https://citylit.vercel.app") {
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length !== 3) return undefined;
    return places.find(
      (place) =>
        place.city === parts[0] &&
        categorySlug(place.category) === parts[1] &&
        place.id === parts[2],
    );
  }
  return places.find((place) =>
    [place.website, place.wikipedia].some((source) => {
      if (!source || !publicHttpsUrl(source)) return false;
      const known = new URL(source);
      return (
        known.origin === url.origin &&
        known.pathname.replace(/\/$/, "") === url.pathname.replace(/\/$/, "")
      );
    }),
  );
}
