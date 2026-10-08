import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { allDiscoveryRoutes, guideRoute, routeTitle, sharePhoto } from "../../../lib/seo";
export const runtime = "nodejs";
export const dynamic = "force-static";
export const dynamicParams = false;
export function generateStaticParams() {
  return allDiscoveryRoutes().map((route) => ({
    path: route.path.slice(1).split("/").filter(Boolean),
  }));
}
export async function GET(_request: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  const route = guideRoute((await params).path);
  if (!route) return new Response("Share image not found", { status: 404 });
  const photo = sharePhoto(route);
  // Only catalog-owned image paths are read; route strings never become file paths.
  const photoPath =
    photo && /^\/images\/[a-f0-9]{12}\.jpg$/.test(photo.src) ? photo.src : undefined;
  const data = await readFile(join(process.cwd(), "public", photoPath || "/app-icon.svg"));
  const image = `data:${photoPath ? "image/jpeg" : "image/svg+xml"};base64,${data.toString("base64")}`;
  const context =
    route.kind === "place"
      ? route.place.imageContext === "venue"
        ? "VENUE PHOTOGRAPH"
        : "CITY ATMOSPHERE · NOT THE VENUE"
      : photoPath
        ? "CITY ATMOSPHERE"
        : "EVERY CITY HAS A SPARK";
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#091323",
        color: "#F3EFE3",
        padding: 52,
        gap: 36,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: 610,
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: 42, fontWeight: 700 }}>citylit ·</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: routeTitle(route).length > 42 ? 52 : 64,
              fontWeight: 700,
              letterSpacing: -2,
              lineHeight: 1.08,
            }}
          >
            {routeTitle(route)}
          </div>
          <div style={{ fontSize: 26, color: "#BBC3D5" }}>Follow a little curiosity.</div>
        </div>
        <div style={{ fontSize: 19, color: "#BBC3D5" }}>SOUTH AFRICA / CITYLIT.VERCEL.APP</div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: 450,
          justifyContent: "center",
          gap: 16,
        }}
      >
        <img
          src={image}
          alt=""
          width={450}
          height={440}
          style={{
            borderRadius: 36,
            objectFit: photoPath ? "cover" : "contain",
            background: "#17243C",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 14,
            color: "#BBC3D5",
            gap: 7,
          }}
        >
          <span>{context}</span>
          {photoPath && (
            <span>
              {photo!.author.slice(0, 95)} · {photo!.license.slice(0, 65)}
            </span>
          )}
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "X-Robots-Tag": "noindex",
      },
    },
  );
}
