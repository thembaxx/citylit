// Render the authored React vectors locally; no HTTP source or running app is needed.
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve("next/package.json"))("sharp");
const root = fileURLToPath(new URL("../", import.meta.url));
// Keep the temporary module under the project so its React imports resolve normally.
const temporary = await mkdtemp(`${root}.citylit-brand-`);
let KhweziMark;
try {
  const compiler = fileURLToPath(
    new URL("bin/tsc", pathToFileURL(require.resolve("typescript/package.json"))),
  );
  execFileSync(
    process.execPath,
    [
      compiler,
      "--ignoreConfig",
      "--jsx",
      "react-jsx",
      "--module",
      "esnext",
      "--moduleResolution",
      "bundler",
      "--target",
      "ES2022",
      "--skipLibCheck",
      "--rootDir",
      root,
      "--outDir",
      temporary,
      `${root}components/KhweziMark.tsx`,
    ],
    { cwd: root, stdio: "inherit" },
  );
  KhweziMark = (await import(pathToFileURL(`${temporary}/components/KhweziMark.js`).href)).default;
} finally {
  await rm(temporary, { recursive: true, force: true });
}
const directory = new URL("../public/brand/", import.meta.url);
await mkdir(directory, { recursive: true });
function vector(pose) {
  return renderToStaticMarkup(createElement(KhweziMark, { pose }))
    .replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ')
    .replace(/ aria-hidden="true"/g, "")
    .replace(/var\(--khwezi-spark, #6558F5\)/g, "#6558F5");
}
const character = vector("idle"),
  body = character.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
await writeFile(new URL("khwezi.svg", directory), character);
const offline = vector("offline").replace(
  '<g class="khwezi-eyes">',
  '<g class="khwezi-eyes" transform="translate(0 94) scale(1 .14)">',
);
await writeFile(new URL("khwezi-offline.svg", directory), offline);
const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" rx="28" fill="#091323"/><svg x="16" y="10" width="96" height="108" fill="none" viewBox="34 8 108 137">${body}</svg></svg>`;
await writeFile(new URL("../app-icon.svg", directory), icon);
for (const [file, size] of [
  ["favicon-16", 16],
  ["favicon-32", 32],
  ["apple-touch-icon", 180],
  ["app-icon-192", 192],
  ["app-icon-512", 512],
])
  await sharp(Buffer.from(icon))
    .resize(size, size)
    .png()
    .toFile(new URL(`${file}.png`, directory).pathname);
const maskable = icon
  .replace('rx="28"', 'rx="0"')
  .replace('x="16" y="10" width="96" height="108"', 'x="25" y="23" width="78" height="84"');
await sharp(Buffer.from(maskable))
  .resize(512, 512)
  .png()
  .toFile(new URL("app-icon-maskable.png", directory).pathname);
const wordmark = `<svg xmlns="http://www.w3.org/2000/svg" width="440" height="140" viewBox="0 0 440 140"><style>@media(prefers-color-scheme:dark){text{fill:#F3EFE3}}</style><text x="10" y="108" font-family="DM Sans, sans-serif" font-size="110" font-weight="700" letter-spacing="-6" fill="#17243C">cıtylit</text><path d="m95 20 8 8-8 8-8-8Z" fill="#6558F5"/></svg>`;
await writeFile(new URL("wordmark.svg", directory), wordmark);
const embedded = (svg, x, y, width, height) =>
  svg.replace(
    /^<svg[^>]*>/,
    `<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="0 0 180 200" fill="none">`,
  );
const social = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#091323"/><circle cx="940" cy="335" r="240" fill="#1C2845"/><text x="70" y="110" fill="#F3EFE3" font-family="sans-serif" font-size="44" font-weight="700">cıtylit</text><path d="m100 72 5 5-5 5-5-5Z" fill="#998BFF"/><text x="70" y="272" fill="#F3EFE3" font-family="sans-serif" font-size="79" font-weight="800" textLength="625" lengthAdjust="spacingAndGlyphs">EVERY CITY</text><text x="70" y="363" fill="#F3EFE3" font-family="sans-serif" font-size="79" font-weight="800" textLength="625" lengthAdjust="spacingAndGlyphs">HAS A SPARK.</text><text x="73" y="443" fill="#BBC3D5" font-family="sans-serif" font-size="25">Follow a little curiosity.</text><text x="73" y="559" fill="#BBC3D5" font-family="monospace" font-size="17">SOUTH AFRICA / LITTLE ADVENTURES / CITYLIT</text>${embedded(vector("welcome"), 765, 80, 345, 450)}</svg>`;
await writeFile(new URL("social-card.svg", directory), social);
await sharp(Buffer.from(social)).png().toFile(new URL("social-card.png", directory).pathname);
const colors = ["#F3EFE3", "#17243C", "#6558F5", "#E9B2BA", "#F3C975"];
const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1380"><rect width="1200" height="1380" fill="#F5F3EB"/><text x="64" y="94" font-family="sans-serif" font-weight="700" font-size="46" fill="#17243C">citylit</text><text x="64" y="174" font-family="monospace" font-size="17" fill="#526381">BRAND FIELD NOTES / KHWEZI / DAY &amp; NIGHT</text><text x="64" y="275" font-family="sans-serif" font-size="78" font-weight="800" fill="#17243C" textLength="1050" lengthAdjust="spacingAndGlyphs">EVERY CITY HAS A SPARK.</text><text x="65" y="332" font-family="sans-serif" font-size="26" fill="#526381">Small adventures. A little wonder. A whole country to discover.</text>${embedded(vector("welcome"), 70, 365, 285, 330)}<text x="390" y="458" font-family="sans-serif" font-weight="700" font-size="50" fill="#17243C">MEET KHWEZI.</text><text x="390" y="515" font-family="sans-serif" font-size="22" fill="#526381">A curious springhare. Enormous ears. A pocket of sparks.</text><text x="390" y="559" font-family="sans-serif" font-size="22" fill="#526381">Ivory, ink and a luminous diamond of electric blue.</text>${colors.map((color, i) => `<rect x="${390 + i * 142}" y="601" width="125" height="65" rx="14" fill="${color}" stroke="#ACB3BC"/><text x="${395 + i * 142}" y="692" font-family="monospace" font-size="15" fill="#526381">${color}</text>`).join("")}<rect x="64" y="746" width="516" height="232" rx="24" fill="#FFFDF8" stroke="#D3D7DB"/>${embedded(vector("welcome"), 85, 765, 150, 170)}<text x="260" y="846" font-family="sans-serif" font-weight="700" font-size="25" fill="#17243C">Follow a little curiosity.</text><text x="260" y="891" font-family="sans-serif" font-size="18" fill="#526381">Warm daylight. A new adventure.</text><rect x="600" y="746" width="536" height="232" rx="24" fill="#091323"/>${embedded(offline, 620, 765, 150, 170)}<text x="793" y="846" font-family="sans-serif" font-weight="700" font-size="25" fill="#F3EFE3"><tspan x="793" dy="0">Your sparks travel</tspan><tspan x="793" dy="32">with you.</tspan></text><text x="793" y="923" font-family="sans-serif" font-size="18" fill="#BBC3D5">A small light to follow.</text>${["welcome", "saved", "search"].map((pose, i) => `${embedded(vector(pose), 82 + i * 360, 1000, 145, 170)}<text x="${74 + i * 360}" y="1228" font-family="sans-serif" font-size="25" font-weight="700" fill="#17243C">${["A friendly invitation.", "A spark for later.", "Somewhere worth finding."][i]}</text>`).join("")}<text x="64" y="1322" font-family="monospace" font-size="16" fill="#526381">CURIOUS / WARM / SLIGHTLY SURREAL · citylit.vercel.app/brand</text></svg>`;
await writeFile(new URL("concept-sheet.svg", directory), sheet);
await sharp(Buffer.from(sheet)).png().toFile(new URL("concept-sheet.png", directory).pathname);
console.log("Exported Khwezi vectors, wordmark, icons, social preview and concept sheet.");
