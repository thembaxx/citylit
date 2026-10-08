import { serializeJsonLd } from "../lib/seo";
export default function JsonLd({ value }: { value: unknown }) {
  return (
    <script
      data-citylit-schema
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(value) }}
    />
  );
}
