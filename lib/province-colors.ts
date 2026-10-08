import { cities, places } from "./data";
const palette: Record<string, string> = {
  GT: "#edb94c",
  WC: "#5eaff1",
  KZ: "#4ed3b8",
  EC: "#e6a387",
  FS: "#aab8ff",
  LI: "#c7aaed",
  MP: "#97c79d",
  NW: "#e5ba87",
  NC: "#e7a9bf",
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
    availableProvinces[code] === undefined ? "#c4c9b2" : color,
  ]),
);
