import { places } from "./data";
import { placePath } from "./adventure";
import { normalizeCorrections, type Correction } from "./client-data";

const issueTracker = "https://github.com/thembaxx/citylit/issues/new";
export const correctionFields: Record<string, string> = {
  address: "Address / entrance",
  accessibility: "Accessibility",
  hours: "Opening hours",
  pricing: "Pricing / payment",
  photos: "Photos",
  other: "Other information",
};

/** Prepare a public report. Opening this link never submits or publishes it. */
export function correctionReport(input: Correction) {
  const draft = normalizeCorrections([input])[0];
  if (!draft) return null;
  const place = places.find((row) => row.id === draft.placeId)!;
  const placeUrl = `https://citylit.vercel.app${placePath(place)}`;
  const details = `${correctionFields[draft.field]}\n\n${draft.value}\n\nDraft created: ${draft.createdAt.slice(0, 10)}. Source check date requires reviewer confirmation.`;
  const issue = new URL(issueTracker);
  issue.searchParams.set("template", "data.yml");
  issue.searchParams.set("title", `Data correction: ${place.name}`);
  issue.searchParams.set("url", placeUrl);
  issue.searchParams.set("correction", details);
  issue.searchParams.set("source", draft.source);
  return {
    // Long reports can be copied into the form without exceeding server URL limits.
    url: issue.href.length <= 7500 ? issue.href : `${issueTracker}?template=data.yml`,
    needsPaste: issue.href.length > 7500,
    text: `${place.name}\n${placeUrl}\n\n${details}\n\nSupporting source: ${draft.source}`,
  };
}
