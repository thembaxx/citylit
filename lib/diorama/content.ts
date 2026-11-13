export type DioramaSlug = "soweto" | "drakensberg" | "pretoria" | "knysna";
export type TimeMode = "day" | "golden" | "night";

export type DioramaLandmark = {
  id: string;
  name: string;
  kicker: string;
  description: string;
  fact: string;
  position: [number, number, number];
  focus?: [number, number, number];
  distance?: number;
  source: { label: string; url: string };
};

export type DioramaContent = {
  slug: DioramaSlug;
  name: string;
  province: string;
  title: string;
  tagline: string;
  description: string;
  accent: string;
  accentSoft: string;
  sky: string;
  landmarks: DioramaLandmark[];
  sources: { label: string; url: string }[];
};

export const DIORAMAS: DioramaContent[] = [
  {
    slug: "soweto",
    name: "Soweto",
    province: "Gauteng",
    title: "Orlando Towers",
    tagline: "A township between two painted giants",
    description:
      "Matchbox houses, a dusty football pitch and the two cooling towers of the old Orlando Power Station. The mine dump on the skyline carries the story of the gold reef that built Johannesburg.",
    accent: "#d98a3d",
    accentSoft: "#f2c98d",
    sky: "#f4ead8",
    landmarks: [
      {
        id: "orlando-towers",
        name: "Orlando Towers",
        kicker: "Landmark",
        description:
          "The two cooling towers are what remains of the Orlando Power Station, which supplied Johannesburg with electricity from the 1940s until 1998. Their painted skins and the bungee jump between them turned an industrial ruin into a Soweto icon.",
        fact: "Commissioned in 1942 · Decommissioned in 1998",
        position: [2.9, 3.3, -0.4],
        focus: [2.9, 1.2, -0.4],
        distance: 9,
        source: {
          label: "Orlando Power Station",
          url: "https://en.wikipedia.org/wiki/Orlando_Power_Station",
        },
      },
      {
        id: "mine-dump",
        name: "The mine dump",
        kicker: "Landscape",
        description:
          "The pale ridges on the horizon are tailings from the Witwatersrand gold mines. They are a visible reminder of the reef that drew people to this part of Gauteng, and of the dust and displacement that came with it.",
        fact: "Witwatersrand gold rush · from 1886",
        position: [-2.4, 3.1, -4.2],
        focus: [-2.4, 1.3, -4.2],
        distance: 10,
        source: {
          label: "Witwatersrand Gold Rush",
          url: "https://en.wikipedia.org/wiki/Witwatersrand_Gold_Rush",
        },
      },
      {
        id: "soccer-field",
        name: "The football pitch",
        kicker: "Everyday life",
        description:
          "A green rectangle stitched into the grid of streets. Football is a daily rhythm in Soweto, and the township has a long connection to the professional game, including the Orlando Pirates.",
        fact: "Orlando Pirates were founded in 1937",
        position: [-1.1, 0.7, -1.4],
        focus: [-1.1, 0.2, -1.4],
        distance: 7.5,
        source: {
          label: "Orlando Pirates",
          url: "https://en.wikipedia.org/wiki/Orlando_Pirates",
        },
      },
    ],
    sources: [
      {
        label: "Orlando Power Station",
        url: "https://en.wikipedia.org/wiki/Orlando_Power_Station",
      },
      { label: "Soweto", url: "https://en.wikipedia.org/wiki/Soweto" },
      {
        label: "Witwatersrand Gold Rush",
        url: "https://en.wikipedia.org/wiki/Witwatersrand_Gold_Rush",
      },
    ],
  },
  {
    slug: "drakensberg",
    name: "Drakensberg",
    province: "KwaZulu-Natal",
    title: "The Amphitheatre",
    tagline: "A cliff wall, a waterfall and a green valley",
    description:
      "The Amphitheatre is a five-kilometre wall of basalt in the Northern Drakensberg. Tugela Falls slips over its lip, then the water finds a way through the valley below. The whole escarpment is part of a UNESCO World Heritage Site.",
    accent: "#4e7f57",
    accentSoft: "#b9d1a7",
    sky: "#e9f0e4",
    landmarks: [
      {
        id: "amphitheatre",
        name: "The Amphitheatre",
        kicker: "Escarpment",
        description:
          "A five-kilometre cliff face in the Northern Drakensberg, shaped like a natural amphitheatre. Its basalt layers were laid down by ancient lava flows and then lifted and eroded into the wall we see today.",
        fact: "Part of the uKhahlamba-Drakensberg Park",
        position: [0.4, 4.1, -2.6],
        focus: [0.4, 2.1, -2.6],
        distance: 10,
        source: {
          label: "Drakensberg",
          url: "https://en.wikipedia.org/wiki/Drakensberg",
        },
      },
      {
        id: "tugela-falls",
        name: "Tugela Falls",
        kicker: "Water",
        description:
          "The Tugela plunges over the Amphitheatre in a series of tiers. Depending on how you count the drops, it is often listed among the tallest waterfalls in the world.",
        fact: "About 947 m in five tiers",
        position: [0.2, 2.2, -0.8],
        focus: [0.2, 1.4, -0.8],
        distance: 8,
        source: {
          label: "Tugela Falls",
          url: "https://en.wikipedia.org/wiki/Tugela_Falls",
        },
      },
      {
        id: "valley",
        name: "The valley",
        kicker: "Grassland",
        description:
          "Below the cliffs, the escarpment gives way to rolling grassland, Afro-montane forest and a river that carries the mountain water down towards the lowveld.",
        fact: "Afro-montane forest and grassland",
        position: [-1.7, 0.8, 2.4],
        focus: [-1.7, 0.3, 2.4],
        distance: 8,
        source: {
          label: "uKhahlamba-Drakensberg Park",
          url: "https://whc.unesco.org/en/list/985/",
        },
      },
    ],
    sources: [
      { label: "Drakensberg", url: "https://en.wikipedia.org/wiki/Drakensberg" },
      { label: "Tugela Falls", url: "https://en.wikipedia.org/wiki/Tugela_Falls" },
      {
        label: "uKhahlamba-Drakensberg Park",
        url: "https://whc.unesco.org/en/list/985/",
      },
    ],
  },
  {
    slug: "pretoria",
    name: "Pretoria",
    province: "Gauteng",
    title: "Union Buildings",
    tagline: "Sandstone, purple jacarandas and formal terraces",
    description:
      "The Union Buildings sit on Meintjieskop and look north over the city. Herbert Baker's curved colonnade, two domed wings and the long terraced gardens below are one of South Africa's most recognisable civic landscapes.",
    accent: "#8b5fbf",
    accentSoft: "#d9c6ef",
    sky: "#f3e9ef",
    landmarks: [
      {
        id: "union-buildings",
        name: "Union Buildings",
        kicker: "Architecture",
        description:
          "Designed by Sir Herbert Baker and completed in 1913, the Union Buildings are the seat of South Africa's national government. The two wings are linked by a curved colonnade, and the terraced gardens step down the hillside.",
        fact: "Completed in 1913 · Sir Herbert Baker",
        position: [0, 2.75, -2.6],
        focus: [0, 1.6, -2.6],
        distance: 10,
        source: {
          label: "Union Buildings",
          url: "https://en.wikipedia.org/wiki/Union_Buildings",
        },
      },
      {
        id: "amphitheatre",
        name: "The garden amphitheatre",
        kicker: "Public space",
        description:
          "The formal gardens include an open-air amphitheatre cut into the lawn. It is used for ceremonies and public events, with the building's colonnade as a backdrop.",
        fact: "Terraced gardens on Meintjieskop",
        position: [-1.1, 1.0, 1.8],
        focus: [-1.1, 0.4, 1.8],
        distance: 7.5,
        source: {
          label: "Union Buildings",
          url: "https://en.wikipedia.org/wiki/Union_Buildings",
        },
      },
      {
        id: "jacarandas",
        name: "Jacaranda avenues",
        kicker: "Season",
        description:
          "Pretoria is nicknamed the Jacaranda City. The purple-flowering trees were introduced in the late nineteenth century and now line many of the city's streets and gardens.",
        fact: "Purple blooms · usually October to November",
        position: [3.7, 1.5, 1.4],
        focus: [3.7, 0.7, 1.4],
        distance: 7.5,
        source: {
          label: "Jacaranda",
          url: "https://en.wikipedia.org/wiki/Jacaranda",
        },
      },
    ],
    sources: [
      { label: "Union Buildings", url: "https://en.wikipedia.org/wiki/Union_Buildings" },
      { label: "Jacaranda", url: "https://en.wikipedia.org/wiki/Jacaranda" },
      { label: "Pretoria", url: "https://en.wikipedia.org/wiki/Pretoria" },
    ],
  },
  {
    slug: "knysna",
    name: "Knysna",
    province: "Western Cape",
    title: "The Heads",
    tagline: "A lagoon mouth between sandstone cliffs",
    description:
      "Two headlands guard the narrow mouth of the Knysna Estuary. Inside, the lagoon is a sheltered world of jetties, yachts and coastal forest; outside, the Indian Ocean works at the sandstone cliffs and sea caves.",
    accent: "#2f8f96",
    accentSoft: "#a9d8d6",
    sky: "#e5f0ec",
    landmarks: [
      {
        id: "the-heads",
        name: "The Heads",
        kicker: "Coast",
        description:
          "The Knysna Heads are two sandstone headlands at the mouth of the Knysna Estuary. The channel between them is narrow and tidal, and the cliffs are weathered by waves and wind.",
        fact: "Mouth of the Knysna Estuary",
        position: [3.6, 2.9, 1.8],
        focus: [3.6, 1.5, 1.8],
        distance: 9,
        source: {
          label: "Knysna Heads",
          url: "https://en.wikipedia.org/wiki/Knysna_Heads",
        },
      },
      {
        id: "lagoon",
        name: "The lagoon",
        kicker: "Estuary",
        description:
          "The Knysna Estuary is one of South Africa's most important estuarine systems. Its sheltered water is used for sailing, fishing and oyster farming, and the surrounding forest is part of the Garden Route.",
        fact: "Marine protected area · Garden Route",
        position: [-0.7, 0.25, -2.6],
        focus: [-0.7, 0.1, -2.6],
        distance: 7.5,
        source: {
          label: "Knysna Estuary",
          url: "https://en.wikipedia.org/wiki/Knysna_Estuary",
        },
      },
      {
        id: "sea-arch",
        name: "The sea arch",
        kicker: "Geology",
        description:
          "Wave action has carved caves and arches into the sandstone at the Heads. At low tide the rock platforms and dark openings are exposed along the base of the cliffs.",
        fact: "Sandstone cliffs · wave-cut platforms",
        position: [0.9, 0.95, 4.5],
        focus: [0.9, 0.55, 4.5],
        distance: 6.5,
        source: {
          label: "Knysna",
          url: "https://en.wikipedia.org/wiki/Knysna",
        },
      },
    ],
    sources: [
      { label: "Knysna Heads", url: "https://en.wikipedia.org/wiki/Knysna_Heads" },
      { label: "Knysna Estuary", url: "https://en.wikipedia.org/wiki/Knysna_Estuary" },
      { label: "Knysna", url: "https://en.wikipedia.org/wiki/Knysna" },
    ],
  },
];

export const DIORAMA_BY_SLUG = Object.fromEntries(
  DIORAMAS.map((item) => [item.slug, item]),
) as Record<DioramaSlug, DioramaContent>;

export function isDioramaSlug(value: string | undefined | null): value is DioramaSlug {
  return (
    value === "soweto" || value === "drakensberg" || value === "pretoria" || value === "knysna"
  );
}
