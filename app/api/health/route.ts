export const dynamic = "force-dynamic";
export function GET() {
  return Response.json(
    { status: "ok", revision: process.env.CITYLIT_RELEASE_SHA || null },
    { headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } },
  );
}
