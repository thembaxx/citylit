export function stageModel(name: string, category = "") {
  const value = name.toLowerCase();
  if (/bo.kaap/.test(value)) return "bo-kaap";
  if (/orlando|cooling tower/.test(value)) return "cooling-towers";
  if (/ushaka|u.shaka|aquarium/.test(value)) return "aquarium";
  if (/robben island/.test(value)) return "fort";
  if (/table mountain|naval hill|mountain|kopje/.test(value)) return "table-mountain";
  if (/union buildings/.test(value)) return "union-buildings";
  if (/ponte/.test(value)) return "ponte";
  if (/bridge/.test(value)) return "bridge";
  if (/stadium|moses mabhida|peter mokaba/.test(value)) return "stadium";
  if (/big hole|diamond/.test(value)) return "hole";
  if (/lighthouse|cape point/.test(value)) return "lighthouse";
  if (/castle|fort|voortrekker/.test(value)) return "fort";
  if (
    /garden|park|zoo|reserve|dam|waterfall|falls|beach/.test(value) ||
    category === "Parks & zoos"
  )
    return "park";
  if (/monument|memorial|freedom|mandela/.test(value)) return "arch";
  if (/tower|church|cathedral|hall|campanile|clock/.test(value) || category === "Lodging")
    return "tower";
  return "dome";
}
