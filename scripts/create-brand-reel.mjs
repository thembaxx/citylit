/**
 * Produces a silent, original CityLit preview from genuine Chromium captures of
 * this checkout's production build. No fabricated UI, external images or music.
 * Run after `pnpm build` with Chromium, ffmpeg and ffprobe installed.
 */
import { chromium } from "@playwright/test";
import { spawn, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const origin = "http://127.0.0.1:3337";
const output = resolve("public/media");
const temp = resolve(".brand-reel-captures");
const story = [
  { route: "/", label: "Explore CityLit" },
  { route: "/cape-town/landmarks", label: "Explore Cape Town" },
  { route: "/johannesburg/landmarks", label: "Explore Johannesburg" },
];

async function ready(server) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw Error("CityLit server exited before capture");
    try {
      const response = await fetch(origin + "/", { signal: AbortSignal.timeout(2000) });
      if (response.ok) return;
    } catch {
      // Wait until the local production server accepts connections.
    }
    await new Promise((finish) => setTimeout(finish, 400));
  }
  throw Error("Local CityLit production server did not become ready");
}

async function main() {
  mkdirSync(output, { recursive: true });
  mkdirSync(temp, { recursive: true });
  const server = spawn("pnpm", ["exec", "next", "start", "--hostname", "127.0.0.1", "--port", "3337"], {
    stdio: "inherit",
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  });
  let browser;
  try {
    await ready(server);
    browser = await chromium.launch({
      headless: true,
      args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
    });
    const page = await browser.newPage({
      viewport: { width: 1200, height: 675 },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    });
    for (const [index, shot] of story.entries()) {
      const modelLoaded = shot.route.includes("/landmarks")
        ? page.waitForResponse(
            (response) =>
              response.url().includes("/models/stage/") && response.status() === 200,
            { timeout: 20000 },
          )
        : null;
      const response = await page.goto(origin + shot.route, { waitUntil: "domcontentloaded" });
      if (!response?.ok()) throw Error("Page unavailable: " + shot.route + " (" + response?.status() + ")");
      await modelLoaded;
      await page.evaluate(() => document.fonts.ready);
      if (shot.route.includes("/landmarks")) {
        await page.locator(".atlas-stage-sheet h2").waitFor({ state: "visible", timeout: 20000 });
      } else {
        await page.locator("body").waitFor({ state: "visible" });
      }
      await page.waitForTimeout(1800);
      await page.screenshot({ path: join(temp, "shot-" + index + ".png"), animations: "disabled" });
      console.log("Captured real CityLit page:", shot.route);
    }
    await browser.close();
    browser = undefined;

    const args = ["-hide_banner", "-loglevel", "error", "-y"];
    for (let index = 0; index < story.length; index++) {
      args.push("-loop", "1", "-framerate", "30", "-t", "3.5", "-i", join(temp, "shot-" + index + ".png"));
    }
    args.push(
      "-filter_complex",
      "[0:v]fps=30,scale=1280:720:flags=lanczos,format=yuv420p,setsar=1[v0];" +
      "[1:v]fps=30,scale=1280:720:flags=lanczos,format=yuv420p,setsar=1[v1];" +
      "[2:v]fps=30,scale=1280:720:flags=lanczos,format=yuv420p,setsar=1[v2];" +
      "[v0][v1]xfade=transition=fade:duration=0.5:offset=3.0[x1];" +
      "[x1][v2]xfade=transition=fade:duration=0.5:offset=6.0[out]",
      "-map", "[out]", "-r", "30", "-an", "-c:v", "libx264",
      "-pix_fmt", "yuv420p", "-preset", "medium", "-crf", "24",
      "-movflags", "+faststart",
      join(output, "citylit-journey.mp4"),
    );
    execFileSync("ffmpeg", args, { stdio: "inherit", timeout: 180000 });
    const videoPath = join(output, "citylit-journey.mp4");
    const bytes = readFileSync(videoPath);
    if (bytes.length < 10000 || bytes.length > 12 * 1024 * 1024) {
      throw Error("Reel size outside the 10 KiB–12 MiB budget");
    }
    const probe = JSON.parse(execFileSync("ffprobe", [
      "-v", "error", "-select_streams", "v:0",
      "-show_entries", "stream=width,height,codec_name",
      "-show_entries", "format=duration",
      "-of", "json", videoPath,
    ], { encoding: "utf8" }));
    if (probe.streams?.[0]?.codec_name !== "h264" || probe.streams[0].width !== 1280 ||
        probe.streams[0].height !== 720 || Math.abs(Number(probe.format?.duration) - 9.5) > 0.6) {
      throw Error("Reel failed codec, size or duration verification");
    }
    writeFileSync(join(output, "citylit-journey.json"), JSON.stringify({
      type: "real-application-capture",
      frame: "1280x720",
      screenshotFrame: "1200x675",
      durationSeconds: Number(probe.format.duration),
      sourceRoutes: story.map(({ route, label }) => ({ route, label })),
      source: "Local production build of CityLit, Chromium screenshots; no mockups",
      authoring: "Playwright screenshot capture and FFmpeg silent H.264 edit",
      sha256: createHash("sha256").update(bytes).digest("hex"),
      bytes: statSync(videoPath).size,
      status: "REVIEW_REQUIRED",
    }, null, 2) + "\n");
    console.log("Verified original CityLit reel", videoPath);
  } finally {
    await browser?.close();
    server.kill("SIGTERM");
  }
}
await main();
