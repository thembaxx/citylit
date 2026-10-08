// Fixed first-party code: its exact bytes are authorized by the CSP hash, even if the root
// layout fails before it can supply a nonce. Never interpolate request or user data here.
export const recoveryThemeScript = `(() => {
  const root = document.documentElement;
  let saved;
  try { saved = localStorage.getItem("citylit-theme"); } catch {}
  const theme = saved === "day" || saved === "night"
    ? saved : matchMedia("(prefers-color-scheme: light)").matches ? "day" : "night";
  root.dataset.theme = theme;
  document.querySelectorAll('meta[name="theme-color"]').forEach(meta => {
    meta.content = theme === "day" ? "#f6f3ed" : "#080f20";
  });
  document.querySelectorAll('meta[name="color-scheme"]').forEach(meta => {
    meta.content = theme === "day" ? "light" : "dark";
  });
  const runtime = document.createElement("script");
  runtime.src = "/theme.js";
  document.head.append(runtime);
})();`;
