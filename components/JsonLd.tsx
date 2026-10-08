import { headers } from "next/headers";
import { serializeJsonLd } from "../lib/seo";
export default async function JsonLd({ value }: { value: unknown }) {
  return (
    <script
      nonce={(await headers()).get("x-nonce") || undefined}
      data-citylit-schema
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(value) }}
    />
  );
}
