/* Offline content is text, known catalog IDs and local photos; never executable source markup. */
const root = document.documentElement;
document.getElementById("theme").onclick = () => {
  document.dispatchEvent(
    new CustomEvent("citylit-theme-preference", {
      detail: root.dataset.theme === "day" ? "night" : "day",
    }),
  );
};
let places = [],
  saved = [],
  itinerary = [],
  visited = [],
  state = {},
  mode = "saved",
  selected = "";
const container = document.getElementById("places"),
  status = document.getElementById("status"),
  actionStatus = document.getElementById("action-status"),
  search = document.getElementById("search"),
  city = document.getElementById("city"),
  category = document.getElementById("category");
const element = (tag, text) => {
  const node = document.createElement(tag);
  node.textContent = text;
  return node;
};
// Use the same local Hugeicons artwork as the online app, without inserting HTML strings.
const withIcon = (node, name = "arrow-up-right", before = false) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "18");
  svg.setAttribute("height", "18");
  svg.setAttribute("fill", "none");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.classList.add("ui-symbol");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", "/icons/ui.svg#" + name);
  svg.append(use);
  if (before) node.prepend(svg);
  else node.append(svg);
  return node;
};
const cityName = (value) =>
  value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
const slug = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const decode = (value) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return "";
  }
};
const ids = (value) =>
  Array.isArray(value)
    ? [
        ...new Set(
          value
            .slice(0, 1000)
            .filter((id) => typeof id === "string" && places.some((place) => place.id === id)),
        ),
      ].slice(0, 500)
    : [];
const publicUrl = (value) => {
  if (
    typeof value !== "string" ||
    value.length > 2048 ||
    Array.from(value).some((char) => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127)
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
function readState() {
  try {
    const raw = localStorage.getItem("citylit-discovery-v2") || "{}",
      value = raw.length <= 200000 ? JSON.parse(raw) : {};
    state = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    const legacy = localStorage.getItem("mzansi-saved") || "[]";
    saved = ids(
      Array.isArray(value)
        ? value
        : state.saved || (legacy.length <= 200000 ? JSON.parse(legacy) : []),
    );
    visited = ids(state.visited);
    itinerary = ids(state.itinerary).slice(0, 30);
  } catch {
    state = {};
    saved = [];
    visited = [];
    itinerary = [];
  }
}
function writeState() {
  try {
    localStorage.setItem(
      "citylit-discovery-v2",
      JSON.stringify({
        saved,
        visited,
        itinerary,
        passport: typeof state.passport === "boolean" ? state.passport : true,
        essential: typeof state.essential === "boolean" ? state.essential : false,
      }),
    );
    localStorage.setItem("mzansi-saved", JSON.stringify(saved));
    return true;
  } catch {
    actionStatus.textContent =
      "Your browser could not keep this change. Free some storage and try again.";
    readState();
    return false;
  }
}
function button(label, action, pressed) {
  const node = element("button", label);
  if (typeof pressed === "boolean") node.setAttribute("aria-pressed", String(pressed));
  node.onclick = action;
  return node;
}
function syncUrl(push = false) {
  const query = new URLSearchParams({ view: mode });
  if (city.value !== "all") query.set("city", city.value);
  if (category.value !== "all") query.set("category", category.value);
  if (search.value) query.set("q", search.value.slice(0, 200));
  const url = "/offline.html?" + query + (selected ? "#" + encodeURIComponent(selected) : "");
  if (push) history.pushState(null, "", url);
  else history.replaceState(null, "", url);
}
function card(place, detail) {
  const article = element("article", "");
  article.id = place.id;
  article.append(
    element("small", place.category + " · " + cityName(place.city)),
    element("h2", place.name),
    element("p", place.description),
    element("p", place.address),
  );
  const photo = Array.isArray(place.images) && place.images[0];
  if (photo && /^\/images\/[a-f0-9]{12}\.jpg$/.test(photo.src)) {
    const image = document.createElement("img");
    image.src = photo.src;
    image.alt = typeof photo.alt === "string" ? photo.alt : place.name;
    image.loading = "lazy";
    image.onerror = () => image.remove();
    article.append(
      image,
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
  const actions = element("div", "");
  actions.className = "place-actions";
  actions.append(
    button(
      saved.includes(place.id) ? "Saved" : "Save discovery",
      () => {
        saved = saved.includes(place.id)
          ? saved.filter((id) => id !== place.id)
          : [...saved, place.id];
        if (writeState())
          actionStatus.textContent = saved.includes(place.id)
            ? "A spark saved on this device."
            : "Discovery released.";
        show();
      },
      saved.includes(place.id),
    ),
  );
  actions.append(
    button(itinerary.includes(place.id) ? "Remove from day" : "Add to day", () => {
      if (itinerary.includes(place.id)) itinerary = itinerary.filter((id) => id !== place.id);
      else {
        if (itinerary.length >= 30) {
          actionStatus.textContent = "Your day already has 30 stops.";
          return;
        }
        const first = places.find((p) => p.id === itinerary[0]);
        if (first && first.city !== place.city) {
          actionStatus.textContent =
            "Your day belongs to another destination. Remove its stops before changing cities.";
          return;
        }
        itinerary.push(place.id);
      }
      if (writeState()) actionStatus.textContent = "Your day is kept on this device.";
      show();
    }),
  );
  if (!detail) {
    const open = withIcon(element("a", "Open discovery"));
    open.href = "#" + encodeURIComponent(place.id);
    open.onclick = (event) => {
      event.preventDefault();
      selected = place.id;
      syncUrl(true);
      show();
      container.querySelector("h2")?.focus({ preventScroll: true });
      scrollTo({ top: 0, behavior: "instant" });
    };
    actions.append(open);
  }
  article.append(actions);
  if (detail) {
    const title = article.querySelector("h2");
    title.tabIndex = -1;
    if (typeof place.about === "string")
      article.append(element("h3", "About"), element("p", place.about));
    if (publicUrl(place.wikipedia)) {
      const wiki = withIcon(element("a", "More on Wikipedia"));
      wiki.href = place.wikipedia;
      article.append(wiki);
    }
    const facts = element("details", "");
    facts.append(element("summary", "Good to know"));
    for (const [key, fact] of Object.entries(place.facts || {})) {
      if (!fact || fact.value === null || fact.confidence === "unknown") continue;
      facts.append(
        element(
          "small",
          key.replace(/([A-Z])/g, " $1") + ": " + fact.value + " · " + fact.confidence,
        ),
      );
    }
    article.append(
      facts,
      button(
        visited.includes(place.id) ? "Visited" : "Mark visited",
        () => {
          visited = visited.includes(place.id)
            ? visited.filter((id) => id !== place.id)
            : [...visited, place.id];
          if (writeState()) actionStatus.textContent = "Your passport is kept on this device.";
          show();
        },
        visited.includes(place.id),
      ),
    );
    if (publicUrl(place.website)) {
      const link = withIcon(element("a", "Venue website"));
      link.href = place.website;
      article.append(element("p", "Live links need a connection."), link);
    }
    if (Array.isArray(place.sources))
      for (const source of place.sources.slice(0, 6)) {
        if (!publicUrl(source?.url)) continue;
        const link = withIcon(element("a", source.title || "Source"));
        link.href = source.url;
        const paragraph = element("p", "");
        paragraph.append(link);
        article.append(paragraph);
      }
  }
  if (typeof place.about === "string" && publicUrl(place.wikipedia)) {
    const credit = element("a", "Wikipedia contributors · CC BY-SA 4.0");
    credit.href = place.wikipedia;
    const attribution = element("small", "");
    attribution.append(credit);
    article.append(attribution);
  }
  article.append(
    element(
      "small",
      "Checked " +
        place.checkedAt +
        " · " +
        (place.coordinateAccuracy === "venue" ? "Venue pin" : "City reference pin"),
    ),
  );
  return article;
}
function show() {
  container.replaceChildren();
  for (const tab of ["saved", "day", "all"])
    document.getElementById(tab).setAttribute("aria-pressed", String(mode === tab));
  let list = selected
    ? places.filter((p) => p.id === selected)
    : mode === "all"
      ? places
      : places.filter((p) => (mode === "day" ? itinerary : saved).includes(p.id));
  if (!selected) {
    const query = search.value.trim().toLowerCase().slice(0, 200);
    list = list.filter(
      (p) =>
        (city.value === "all" || city.value === p.city) &&
        (category.value === "all" || category.value === slug(p.category)) &&
        (!query ||
          [p.name, p.description, p.address, p.city, p.category]
            .join(" ")
            .toLowerCase()
            .includes(query)),
    );
  }
  if (mode === "day") list.sort((a, b) => itinerary.indexOf(a.id) - itinerary.indexOf(b.id));
  status.textContent = list.length + " cached discoveries";
  if (selected) {
    const back = withIcon(
      button("Back to discoveries", () => {
        selected = "";
        syncUrl();
        show();
      }),
      "arrow-left",
      true,
    );
    back.className = "offline-detail-back";
    container.append(back);
  }
  for (const place of list) container.append(card(place, Boolean(selected)));
  if (!list.length)
    container.append(
      element(
        "p",
        mode === "all"
          ? "No discoveries match. Try another destination or search."
          : "No places here yet. Browse cached places to save a spark or build your day.",
      ),
    );
}
function restoreUrl() {
  const params = new URLSearchParams(location.search),
    parts = location.pathname.split("/").filter(Boolean);
  mode = ["all", "day", "saved"].includes(params.get("view"))
    ? params.get("view")
    : parts[0] === "explore" && params.get("tab") === "day"
      ? "day"
      : parts[0] !== "offline.html" && places.some((p) => p.city === parts[0])
        ? "all"
        : "saved";
  city.value = params.get("city") || (places.some((p) => p.city === parts[0]) ? parts[0] : "all");
  if (!city.value) city.value = "all";
  category.value = params.get("category") || parts[1] || "all";
  if (!category.value) category.value = "all";
  search.value = (params.get("q") || "").slice(0, 200);
  const candidate = decode(location.hash.slice(1)) || parts[2] || "";
  selected = places.some(
    (p) =>
      p.id === candidate && (!parts[2] || (p.city === parts[0] && slug(p.category) === parts[1])),
  )
    ? candidate
    : "";
  const shared = params.get("shared-url") || params.get("shared-text");
  if (publicUrl(shared)) {
    const url = new URL(shared),
      parts = url.pathname.split("/").filter(Boolean);
    const match = places.find(
      (place) =>
        (url.origin === "https://citylit.vercel.app" &&
          parts.length === 3 &&
          place.city === parts[0] &&
          slug(place.category) === parts[1] &&
          place.id === parts[2]) ||
        [place.website, place.wikipedia].some((source) => {
          if (!publicUrl(source)) return false;
          const known = new URL(source);
          return (
            known.origin === url.origin &&
            known.pathname.replace(/\/$/, "") === url.pathname.replace(/\/$/, "")
          );
        }),
    );
    if (match) {
      selected = match.id;
      mode = "all";
      city.value = match.city;
      category.value = slug(match.category);
    }
  }
  show();
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
    for (const value of [...new Set(places.map((p) => p.city))].sort()) {
      const option = element("option", cityName(value));
      option.value = value;
      city.append(option);
    }
    for (const value of new Set(places.map((p) => p.category))) {
      const option = element("option", value);
      option.value = slug(value);
      category.append(option);
    }
    readState();
    restoreUrl();
  })
  .catch(() => {
    status.textContent = "No cached guide yet. Connect once to prepare your Citylit pocket guide.";
  });
for (const tab of ["saved", "day", "all"])
  document.getElementById(tab).onclick = () => {
    mode = tab;
    selected = "";
    city.value = "all";
    category.value = "all";
    search.value = "";
    syncUrl();
    show();
  };
for (const filter of [search, city, category])
  filter.addEventListener(filter === search ? "input" : "change", () => {
    selected = "";
    syncUrl();
    show();
  });
window.addEventListener("popstate", restoreUrl);
window.addEventListener("storage", () => {
  readState();
  show();
});
const connection = () => {
  document.getElementById("connection").textContent = navigator.onLine
    ? "POCKET GUIDE · live features available when connected"
    : "OFFLINE · saved sparks, plans and cached places still work";
};
connection();
window.addEventListener("online", connection);
window.addEventListener("offline", connection);
