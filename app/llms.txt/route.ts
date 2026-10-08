import { llmsIndex, markdownResponse } from "../../lib/guides";
export const dynamic = "force-static";
export function GET() {
  const response = markdownResponse(llmsIndex());
  response.headers.set("Content-Type", "text/plain; charset=utf-8");
  return response;
}
