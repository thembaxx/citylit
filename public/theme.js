/* Parser-blocking, first-party bootstrap: runs before React and offline content paint. */
(() => {
  const root = document.documentElement;
  const system = matchMedia("(prefers-color-scheme: light)");
  const valid = (value) => value === "day" || value === "night";
  let preference = null;
  try {
    const saved = localStorage.getItem("citylit-theme");
    if (valid(saved)) preference = saved;
  } catch {
    /* A denied storage permission still allows an OS-aware theme. */
  }
  function syncChrome() {
    const day = root.dataset.theme === "day";
    const color = day ? "#f6f3ed" : "#080f20";
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
      if (meta.content !== color) meta.content = color;
    });
    document.querySelectorAll('meta[name="color-scheme"]').forEach((meta) => {
      const scheme = day ? "light" : "dark";
      if (meta.content !== scheme) meta.content = scheme;
    });
  }
  function apply() {
    const theme = preference || (system.matches ? "day" : "night");
    if (root.dataset.theme !== theme) root.dataset.theme = theme;
    syncChrome();
  }
  apply();
  system.addEventListener("change", () => {
    if (!preference) apply();
  });
  window.addEventListener("storage", (event) => {
    if (event.key !== "citylit-theme" && event.key !== null) return;
    preference = valid(event.newValue) ? event.newValue : null;
    apply();
  });
  document.addEventListener("citylit-theme-preference", (event) => {
    if (!valid(event.detail)) return;
    preference = event.detail;
    // Keep the choice in memory even if persistence is unavailable.
    try {
      localStorage.setItem("citylit-theme", preference);
    } catch {}
    apply();
  });
  new MutationObserver(() => {
    // React's root recovery can clear singleton attributes; restore the resolved choice.
    if (!valid(root.dataset.theme)) apply();
    else syncChrome();
  }).observe(root, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  // Next can replace viewport metadata during navigation or recovery.
  new MutationObserver(syncChrome).observe(document.head, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["content", "media"],
  });
})();
