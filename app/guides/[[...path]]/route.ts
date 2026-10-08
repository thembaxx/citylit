import { allDiscoveryRoutes, guideRoute } from "../../../lib/seo";
import { guideMarkdown, markdownResponse } from "../../../lib/guides";
export const dynamic = "force-static";
export function generateStaticParams() {
  return allDiscoveryRoutes().map((route) => ({
    path: route.path.slice(1).split("/").filter(Boolean),
  }));
}
export async function GET(_request: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  const route = guideRoute((await params).path);
  return route
    ? markdownResponse(guideMarkdown(route), route.path)
    : new Response("Guide not found", { status: 404, headers: { "X-Robots-Tag": "noindex" } });
}
