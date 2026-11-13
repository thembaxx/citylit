// Declarative metadata for every CityLit stage model.
// Geometry stays in procedural-landmarks.js; this file owns the facts that
// inspection, physics, scoring and accessibility all need to agree on:
// joints, real-world proportions, material intent and provenance.
//
// Dimensions are approximate published figures used for scale comparison only.
// The models remain original illustrative studies, not surveys.

const archHeight = 7.2;
const archY = (x) => Math.max(0.1, archHeight * (1 - (x / 5.6) ** 2));

const stadiumCablePath = Array.from({ length: 11 }, (_, index) => {
  const x = -5.2 + (index / 10) * 10.4;
  return [x, archY(x) - 0.32, 0];
});

const tableCableLine = [
  [1, 1, 6.4],
  [1, 2.8, 1.8],
];

export const LANDMARK_SPECS = Object.freeze({
  "table-mountain": {
    label: "Table Mountain",
    kind: "landscape",
    real: { width: 3000, height: 1085, depth: 2400, unit: "m" },
    material: "cliff",
    provenance: "Illustrative procedural study of the Table Mountain massif; not a survey.",
    joints: [
      {
        id: "cable-car-up",
        label: "Cable car · ascent",
        type: "path",
        target: "table-mountain-cable-car-up",
        path: tableCableLine,
        damping: 5,
      },
      {
        id: "cable-car-down",
        label: "Cable car · descent",
        type: "path",
        target: "table-mountain-cable-car-down",
        path: [...tableCableLine].reverse(),
        damping: 5,
      },
    ],
  },
  stadium: {
    label: "Moses Mabhida Stadium",
    kind: "architecture",
    real: { width: 320, height: 106, depth: 280, unit: "m" },
    material: "membrane",
    provenance: "Illustrative procedural study of the stadium bowl and signature arch.",
    joints: [
      {
        id: "arch-car",
        label: "Arch cable car",
        type: "path",
        target: "moses-mabhida-arch-cable-car",
        path: stadiumCablePath,
        damping: 6,
      },
      {
        id: "roof-lift",
        label: "Roof membrane",
        type: "prismatic",
        target: "moses-mabhida-radial-roof",
        axis: [0, 1, 0],
        distance: 0.45,
        damping: 7,
      },
    ],
  },
  "union-buildings": {
    label: "Union Buildings",
    kind: "architecture",
    real: { width: 285, height: 60, depth: 180, unit: "m" },
    material: "sandstone",
    provenance: "Illustrative procedural study of Baker's symmetrical sandstone wings.",
    joints: [
      {
        id: "wing-east",
        label: "East wing",
        type: "prismatic",
        target: "union-buildings-east-wing",
        axis: [1, 0, 0],
        distance: 0.5,
        damping: 7,
      },
      {
        id: "wing-west",
        label: "West wing",
        type: "prismatic",
        target: "union-buildings-west-wing",
        axis: [-1, 0, 0],
        distance: 0.5,
        damping: 7,
      },
    ],
  },
  "nelson-mandela-bridge": {
    label: "Nelson Mandela Bridge",
    kind: "infrastructure",
    real: { width: 284, height: 27, depth: 30, unit: "m" },
    material: "concrete",
    provenance: "Illustrative procedural study of the cable-stayed bridge and approaches.",
    joints: [],
  },
  hole: {
    label: "The Big Hole",
    kind: "landscape",
    real: { width: 1600, height: 215, depth: 1600, unit: "m" },
    material: "cliff",
    provenance: "Illustrative procedural study of the open-pit mine and headframe.",
    joints: [
      {
        id: "sheave",
        label: "Headframe sheave",
        type: "revolute",
        target: "big-hole-headframe-sheave",
        axis: [0, 0, 1],
        range: [0, -Math.PI * 3.8],
        damping: 4,
      },
      {
        id: "skip",
        label: "Mine skip",
        type: "path",
        target: "big-hole-mine-skip",
        path: [
          [2.2, -1.65, -0.6],
          [6.3, 3.45, -1.4],
        ],
        damping: 4,
      },
    ],
  },
  ponte: {
    label: "Ponte City",
    kind: "architecture",
    real: { width: 55, height: 173, depth: 55, unit: "m" },
    material: "concrete",
    provenance: "Illustrative procedural study of Ponte City's cylindrical ring and atrium.",
    joints: [
      {
        id: "lift",
        label: "Atrium lift",
        type: "prismatic",
        target: "ponte-city-atrium-lift",
        axis: [0, 1, 0],
        distance: 2.2,
        damping: 5,
      },
    ],
  },
  lighthouse: {
    label: "Lighthouse",
    kind: "architecture",
    real: { width: 12, height: 22, depth: 12, unit: "m" },
    material: "limestone",
    provenance: "Illustrative procedural lighthouse archetype for coastal places.",
    joints: [
      {
        id: "beam",
        label: "Lantern beam",
        type: "revolute",
        target: "lighthouse-lantern-beam",
        axis: [0, 1, 0],
        range: [0, Math.PI * 2],
        damping: 2,
      },
    ],
  },
  tower: {
    label: "Civic tower",
    kind: "architecture",
    real: { width: 40, height: 55, depth: 40, unit: "m" },
    material: "sandstone",
    provenance: "Illustrative civic-hall archetype; not a specific surveyed building.",
    joints: [
      {
        id: "clock-minute",
        label: "Clock minute hand",
        type: "revolute",
        target: "tower-clock-minute-hand",
        axis: [0, 0, 1],
        range: [0, Math.PI * 2],
        damping: 2,
      },
      {
        id: "clock-hour",
        label: "Clock hour hand",
        type: "revolute",
        target: "tower-clock-hour-hand",
        axis: [0, 0, 1],
        range: [0, Math.PI / 6],
        damping: 2,
      },
    ],
  },
  voortrekker: {
    label: "Voortrekker Monument",
    kind: "architecture",
    real: { width: 40, height: 62, depth: 40, unit: "m" },
    material: "sandstone",
    provenance:
      "Illustrative procedural study of the granite monument, frieze base and wagon laager.",
    joints: [],
  },
  dome: {
    label: "Civic Hall & Rotunda",
    kind: "architecture",
    real: { width: 65, height: 42, depth: 52, unit: "m" },
    material: "limestone",
    provenance: "Illustrative domed civic hall archetype with portico and cupola.",
    joints: [],
  },
  fort: {
    label: "Stone Fort & Bastion",
    kind: "architecture",
    real: { width: 85, height: 18, depth: 75, unit: "m" },
    material: "sandstone",
    provenance: "Illustrative colonial stone fort archetype with corner bastions and ramparts.",
    joints: [],
  },
});

const SPEC_ALIASES = {
  bridge: "nelson-mandela-bridge",
};

export function landmarkSpec(model) {
  return LANDMARK_SPECS[model] ?? LANDMARK_SPECS[SPEC_ALIASES[model]] ?? null;
}

export function landmarkJoints(model) {
  return landmarkSpec(model)?.joints ?? [];
}

export function landmarkJointLabels(model) {
  return landmarkJoints(model).map(({ id, label }) => ({ id, label }));
}
