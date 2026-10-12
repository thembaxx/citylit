import { cities, places } from "./data";
/** Clay-diorama colours matched to the province toy map. */
const palette: Record<string, string> = {
  GT: "#e23d3a",
  WC: "#f48cb6",
  KZ: "#e45bb5",
  EC: "#3ec8c2",
  FS: "#f08a2c",
  LI: "#f2d234",
  MP: "#a6d34a",
  NW: "#8e63d6",
  NC: "#4aa4ea",
};
export const availableProvinces: Record<string, number> = Object.fromEntries(
  [
    ...new Set(
      cities.filter((c) => places.some((p) => p.city === c.slug)).map((c) => c.provinceCode),
    ),
  ].map((code) => [
    code,
    cities.findIndex((c) => c.provinceCode === code && places.some((p) => p.city === c.slug)),
  ]),
);

export const provinceColors: Record<string, string> = Object.fromEntries(
  Object.entries(palette).map(([code, color]) => [
    code,
    availableProvinces[code] === undefined ? "#c5c6c2" : color,
  ]),
);
