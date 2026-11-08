export function stageModel(name: string, category = "") {
  const value = name.toLowerCase();
  if (/bo.kaap/.test(value)) return "bo-kaap";
  if (/orlando|cooling tower/.test(value)) return "cooling-towers";
  if (/ushaka|u.shaka|aquarium/.test(value)) return "aquarium";
  if (/robben island/.test(value)) return "fort";
  if (/table mountain|naval hill|mountain|kopje|jonkershoek|god.s window/.test(value))
    return "table-mountain";
  if (/union buildings/.test(value)) return "union-buildings";
  if (/ponte/.test(value)) return "ponte";
  if (/bridge/.test(value)) return "bridge";
  if (/stadium|moses mabhida|peter mokaba/.test(value)) return "stadium";
  if (/big hole|diamond/.test(value)) return "hole";
  if (/voortrekker/.test(value)) return "voortrekker";
  if (/lighthouse|cape point/.test(value)) return "lighthouse";
  if (/hotel|lodge|guesthouse|guest house|accommodation/.test(value) || category === "Lodging")
    return "hotel";
  if (/sudwala|cave|grotto/.test(value)) return "cave";
  if (/waterfall|falls/.test(value)) return "waterfall";
  if (/castle|fort|constitution hill/.test(value)) return "fort";
  if (/bakone|village|dorp street|mapungubwe/.test(value)) return "village";
  if (/museum|gallery|oliewenhuis|bayworld|heritage/.test(value)) return "museum";
  if (/theatre|theater|playhouse|performing arts/.test(value) || category === "Theatres")
    return "theatre";
  if (/meropa|boardwalk|casino|palms/.test(value) || category === "Clubs") return "entertainment";
  if (
    /garden|park|zoo|reserve|dam|beach|wildebeest kuil/.test(value) ||
    category === "Parks & zoos"
  )
    return "park";
  if (/monument|memorial|freedom|mandela|route 67/.test(value)) return "arch";
  if (/tower|church|cathedral|hall|campanile|clock|moederkerk/.test(value)) return "tower";
  return "dome";
}
