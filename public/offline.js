/* The field guide renders source text as text, and never trusts storage as a schema. */
try {
  document.documentElement.dataset.theme =
    localStorage.getItem("citylit-theme") ||
    (matchMedia("(prefers-color-scheme: light)").matches ? "day" : "night");
} catch {}
let places = [],
  saved = [],
  itinerary = [];
const container = document.getElementById("places"),
  status = document.getElementById("status");
const element = (tag, text) => {
  const node = document.createElement(tag);
  node.textContent = text;
  return node;
};
const publicUrl = (value) => {
  if (
    typeof value !== "string" ||
    value.length > 2048 ||
    Array.from(value).some(
      (character) => character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127,
    )
  )
    return false;
  try {
    const url = new URL(value),
      host = url.hostname;
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      /^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(host) &&
      !/^\d+(?:\.\d+){3}$/.test(host) &&
      !/(?:^|\.)(?:localhost|local|internal|test|invalid)$/.test(host)
    );
  } catch {
    return false;
  }
};
const decode = (value) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return "";
  }
};
function show(mode) {
  container.replaceChildren();
  const pathId = decode(location.pathname.split("/").pop());
  const selected =
    decode(location.hash.slice(1)) || (places.some((place) => place.id === pathId) ? pathId : "");
  const list = selected
    ? places.filter((place) => place.id === selected)
    : mode === "all"
      ? places
      : places.filter((place) => (mode === "day" ? itinerary : saved).includes(place.id));
  if (mode === "day") list.sort((a, b) => itinerary.indexOf(a.id) - itinerary.indexOf(b.id));
  status.textContent = list.length + " cached discoveries";
  for (const place of list) {
    const card = element("article", "");
    card.id = place.id;
    card.append(
      element("small", place.category + " · " + place.city.replaceAll("-", " ")),
      element("h2", place.name),
      element("p", place.description),
      element("p", place.address),
    );
    const photo = Array.isArray(place.images) && place.images[0];
    if (photo && /^\/images\/[a-f0-9]{12}\.jpg$/.test(photo.src)) {
      const image = document.createElement("img");
      image.src = photo.src;
      image.alt = photo.alt;
      image.loading = "lazy";
      image.onerror = () => image.remove();
      card.append(image);
      card.append(
        element(
          "small",
          photo.author +
            " · " +
            photo.license +
            " · " +
            (place.imageContext === "venue" ? "Venue photo" : "City atmosphere"),
        ),
      );
    }
    if (typeof place.about === "string") {
      card.append(element("h3", "About"), element("p", place.about));
      if (publicUrl(place.wikipedia)) {
        const wiki = element("a", "Wikipedia contributors · CC BY-SA 4.0");
        wiki.href = place.wikipedia;
        card.append(wiki);
      }
    }
    for (const [key, fact] of Object.entries(place.facts || {})) {
      if (!fact || fact.value === null || fact.confidence === "unknown") continue;
      card.append(
        element(
          "small",
          key.replace(/([A-Z])/g, " $1") + ": " + fact.value + " · " + fact.confidence,
        ),
      );
    }
    card.append(
      element(
        "small",
        "Checked " +
          place.checkedAt +
          " · " +
          (place.coordinateAccuracy === "venue" ? "Venue pin" : "City reference pin"),
      ),
    );
    if (publicUrl(place.website)) {
      const link = element("a", "Venue website ↗");
      link.href = place.website;
      card.append(link);
    }
    container.append(card);
  }
  if (!list.length)
    container.append(
      element(
        "p",
        "No places in this collection yet. Save discoveries while online, then download your field guide.",
      ),
    );
}
fetch("/data/places.json")
  .then((response) => {
    if (!response.ok) throw new Error("Guide unavailable");
    return response.json();
  })
  .then((data) => {
    if (!Array.isArray(data)) throw new Error("Invalid guide");
    places = data
      .slice(0, 500)
      .filter(
        (place) =>
          place &&
          ["id", "name", "city", "category", "description", "address"].every(
            (key) => typeof place[key] === "string",
          ),
      );
    const ids = (value) =>
      Array.isArray(value)
        ? [
            ...new Set(
              value
                .slice(0, 1000)
                .filter((id) => typeof id === "string" && places.some((place) => place.id === id)),
            ),
          ].slice(0, 83)
        : [];
    try {
      const raw = localStorage.getItem("citylit-discovery-v2") || "{}";
      const state = raw.length <= 200000 ? JSON.parse(raw) : {};
      const legacy = localStorage.getItem("mzansi-saved") || "[]";
      saved = ids(
        Array.isArray(state)
          ? state
          : state?.saved || (legacy.length <= 200000 ? JSON.parse(legacy) : []),
      );
      itinerary = ids(state?.itinerary).slice(0, 30);
    } catch {
      saved = [];
      itinerary = [];
    }
    show("saved");
  })
  .catch(() => {
    status.textContent =
      "No cached guide yet. Connect once and choose Save field guide offline in your passport.";
  });
for (const mode of ["saved", "day", "all"])
  document.getElementById(mode).onclick = () => {
    history.replaceState(null, "", location.pathname);
    show(mode);
  };
