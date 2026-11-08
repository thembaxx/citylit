// Shared catalogue used by the model review and scorecard scripts.
//
// The bridge builder paints a window texture on a canvas, so Node gets a
// minimal shim. Nothing in the shim is used at runtime in the browser.
import {
  createProceduralLandmark,
  disposeProceduralLandmark,
} from "../lib/procedural-landmarks.js";

globalThis.document ??= {
  createElement(tag) {
    if (tag !== "canvas") return {};
    return {
      width: 0,
      height: 0,
      getContext: () => ({ fillStyle: "", fillRect() {} }),
    };
  },
};

export const CASES = [
  { name: "Table Mountain", model: "table-mountain" },
  { name: "Moses Mabhida Stadium", model: "stadium" },
  { name: "Union Buildings", model: "union-buildings" },
  { name: "Nelson Mandela Bridge", model: "bridge" },
  { name: "The Big Hole", model: "hole" },
  { name: "Ponte City", model: "ponte" },
  { name: "Voortrekker Monument", model: "voortrekker" },
  { name: "Lighthouse", model: "lighthouse" },
  { name: "Civic Hall", model: "tower" },
  { name: "Civic Centre", model: "dome" },
  { name: "Stone Fort", model: "fort" },
];

export function buildCase({ name, model }) {
  return createProceduralLandmark(name, model);
}

export function releaseCase(root) {
  disposeProceduralLandmark(root);
}
