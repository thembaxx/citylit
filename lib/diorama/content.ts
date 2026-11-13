export type DioramaSlug =
  | "soweto"
  | "drakensberg"
  | "pretoria"
  | "knysna"
  | "hole-in-the-wall"
  | "sani-pass"
  | "winelands"
  | "cape-point"
  | "augrabies"
  | "boulders"
  | "robben-island"
  | "kosi-bay"
  | "addo"
  | "valley-of-desolation";
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
  {
    slug: "hole-in-the-wall",
    name: "Hole in the Wall",
    province: "Eastern Cape",
    title: "The Wild Coast arch",
    tagline: "A wave-cut arch on a green shore",
    description:
      "Off Coffee Bay, a free-standing rock arch stands clear of the cliffs while the Indian Ocean works at the coastline behind it. Xhosa families farm the grassy headlands, and the surf keeps up a constant roar — the isiXhosa name for the arch, EsiKhaleni, means place of sound.",
    accent: "#1f8f86",
    accentSoft: "#9fd6c6",
    sky: "#e3f1ea",
    landmarks: [
      {
        id: "the-arch",
        name: "The arch",
        kicker: "Geology",
        description:
          "A promontory of Karoo sandstone and shale, drilled through by wave action until only the roof of the cave was left standing. The arch rises straight out of the surf and is cut off from the cliffs at high tide.",
        fact: "IsiXhosa name: EsiKhaleni, 'place of sound'",
        position: [-3.0, 1.5, 1.35],
        focus: [-2.7, 1.0, -0.6],
        distance: 8.5,
        source: {
          label: "Coffee Bay and the Hole in the Wall",
          url: "https://en.wikipedia.org/wiki/Coffee_Bay",
        },
      },
      {
        id: "rondavels",
        name: "Rondavel hamlet",
        kicker: "Settlement",
        description:
          "Round huts with conical thatch roofs sit on the green shelf above the bay. Cattle, maize plots and footpaths between homesteads are the everyday pattern of the rural Wild Coast.",
        fact: "Thatched rondavels · cattle and maize",
        position: [1.8, 1.1, -1.05],
        focus: [0.9, 0.6, -1.5],
        distance: 7.5,
        source: {
          label: "Wild Coast",
          url: "https://en.wikipedia.org/wiki/Wild_Coast",
        },
      },
      {
        id: "sandy-bay",
        name: "The sandy bay",
        kicker: "Coast",
        description:
          "A pocket of pale sand between rock shelves, scoured by the same swell that cut the arch. The Wild Coast has no continuous road along the shore, so many of these beaches are reached on foot.",
        fact: "Indian Ocean swell · sandstone platforms",
        position: [1.5, 0.25, 1.7],
        focus: [1.9, 0.1, 1.7],
        distance: 8,
        source: {
          label: "Wild Coast",
          url: "https://en.wikipedia.org/wiki/Wild_Coast",
        },
      },
    ],
    sources: [
      { label: "Coffee Bay", url: "https://en.wikipedia.org/wiki/Coffee_Bay" },
      { label: "Wild Coast", url: "https://en.wikipedia.org/wiki/Wild_Coast" },
    ],
  },
  {
    slug: "sani-pass",
    name: "Sani Pass",
    province: "KwaZulu-Natal",
    title: "The pass to the highlands",
    tagline: "Hairpins stacked against a cliff",
    description:
      "The gravel road from Underberg climbs the Drakensberg escarpment in a stack of hairpin bends and crosses into Lesotho at the top. It is the only road link between KwaZulu-Natal and the Mountain Kingdom's highlands, and the gradient is steep enough to keep trucks in low gear.",
    accent: "#6b7f4a",
    accentSoft: "#c6cfa2",
    sky: "#e9eee0",
    landmarks: [
      {
        id: "the-switchbacks",
        name: "The switchbacks",
        kicker: "Road",
        description:
          "A single gravel lane works its way up the face in tight zigzags, gaining height on short traverses. Vehicles climbing and descending share the road, and the edge is unprotected for much of its length.",
        fact: "Top of the pass: 2,876 m",
        position: [2.0, 1.2, 0.45],
        focus: [1.5, 1.1, 0.6],
        distance: 8,
        source: {
          label: "Sani Pass",
          url: "https://en.wikipedia.org/wiki/Sani_Pass",
        },
      },
      {
        id: "the-waterfall",
        name: "The waterfall",
        kicker: "Water",
        description:
          "Runoff from the escarpment drops over a rock step beside the road, feeding a stream that cuts down towards the valley. In summer the whole face streams with water and the rock darkens.",
        fact: "Escarpment runoff · summer rain",
        position: [-2.14, 1.7, -0.28],
        focus: [-1.9, 0.9, 0.2],
        distance: 6.5,
        source: {
          label: "Drakensberg",
          url: "https://en.wikipedia.org/wiki/Drakensberg",
        },
      },
      {
        id: "the-summit",
        name: "The summit",
        kicker: "Highland",
        description:
          "At the top the road levels onto the Lesotho highlands, where the air is thin and the basalt is cut by gullies. A border post and a stone lodge mark the crossing.",
        fact: "Lesotho border · 2,876 m",
        position: [2.4, 3.1, -2.5],
        focus: [2.4, 2.5, -2.5],
        distance: 9,
        source: {
          label: "Sani Pass",
          url: "https://en.wikipedia.org/wiki/Sani_Pass",
        },
      },
    ],
    sources: [
      { label: "Sani Pass", url: "https://en.wikipedia.org/wiki/Sani_Pass" },
      { label: "Drakensberg", url: "https://en.wikipedia.org/wiki/Drakensberg" },
      { label: "Lesotho", url: "https://en.wikipedia.org/wiki/Lesotho" },
    ],
  },
  {
    slug: "winelands",
    name: "Cape Winelands",
    province: "Western Cape",
    title: "The vineyard werf",
    tagline: "White gables between vine rows",
    description:
      "A Cape Dutch homestead stands at the centre of its werf, framed by oak trees, with vineyard rows combed across the valley floor and a mountain folded up behind. Wine has been made here since the seventeenth century, when the first vines were planted at Constantia.",
    accent: "#7d6aa8",
    accentSoft: "#d6cdea",
    sky: "#f0ecf6",
    landmarks: [
      {
        id: "the-homestead",
        name: "The homestead",
        kicker: "Architecture",
        description:
          "Whitewashed walls, a steep thatched roof and a decorated central gable — the Cape Dutch style borrowed its plasterwork from Dutch and German building traditions and its plan from the Cape's own climate and labour history.",
        fact: "Cape Dutch gables · 18th century",
        position: [-2.5, 0.75, -0.4],
        focus: [-2.5, 0.5, -0.4],
        distance: 7.5,
        source: {
          label: "Cape Dutch architecture",
          url: "https://en.wikipedia.org/wiki/Cape_Dutch_architecture",
        },
      },
      {
        id: "vine-rows",
        name: "The vine rows",
        kicker: "Agriculture",
        description:
          "Vines are trained along trellises in long rows, orientated to catch the sun and the valley breeze. The Cape Winelands is one of the oldest wine-producing regions in the southern hemisphere.",
        fact: "Vines planted at the Cape from 1655",
        position: [1.7, 0.5, 1.7],
        focus: [1.7, 0.3, 1.7],
        distance: 7,
        source: {
          label: "Cape Winelands",
          url: "https://en.wikipedia.org/wiki/Cape_Winelands",
        },
      },
      {
        id: "farm-dam",
        name: "The farm dam",
        kicker: "Water",
        description:
          "Irrigation dams store winter rain for the dry summer ripening season. The farm dam doubles as a swimming spot for the birds that work the vineyards.",
        fact: "Winter rainfall · summer ripening",
        position: [1.5, 0.35, -0.9],
        focus: [1.5, 0.2, -0.9],
        distance: 6.5,
        source: {
          label: "Cape Winelands",
          url: "https://en.wikipedia.org/wiki/Cape_Winelands",
        },
      },
    ],
    sources: [
      { label: "Cape Winelands", url: "https://en.wikipedia.org/wiki/Cape_Winelands" },
      {
        label: "Cape Dutch architecture",
        url: "https://en.wikipedia.org/wiki/Cape_Dutch_architecture",
      },
      { label: "Groot Constantia", url: "https://en.wikipedia.org/wiki/Groot_Constantia" },
    ],
  },
  {
    slug: "cape-point",
    name: "Cape Point",
    province: "Western Cape",
    title: "The lighthouse cliffs",
    tagline: "A cove beneath the light",
    description:
      "Cape Point ends in cliffs above a narrow white beach, with the light station on the summit and the funicular track running down the ridge. Bartolomeu Dias named the headland the Cape of Storms in 1488; the Portuguese crown preferred the Cape of Good Hope.",
    accent: "#2b7fa8",
    accentSoft: "#a8d2e0",
    sky: "#e4eff2",
    landmarks: [
      {
        id: "the-lighthouse",
        name: "The lighthouse",
        kicker: "Navigation",
        description:
          "The first light was switched on in 1860, high on the point. It was moved to its present position in 1919 because the original site was too often wrapped in cloud — a problem the Cape's fog still supplies.",
        fact: "First lit 1860 · relocated 1919",
        position: [0.3, 3.5, -2.5],
        focus: [0.3, 2.7, -2.5],
        distance: 9,
        source: {
          label: "Cape Point",
          url: "https://en.wikipedia.org/wiki/Cape_Point",
        },
      },
      {
        id: "diaz-beach",
        name: "Diaz Beach",
        kicker: "Coast",
        description:
          "A pocket beach wedged between cliff walls, reached by a long staircase from the point. The cove is sheltered from the wind but not from the swell, which keeps the sand narrow.",
        fact: "Named for Bartolomeu Dias, 1488",
        position: [0.9, 0.15, 1.5],
        focus: [0.9, 0.1, 1.5],
        distance: 7.5,
        source: {
          label: "Cape Point",
          url: "https://en.wikipedia.org/wiki/Cape_Point",
        },
      },
      {
        id: "funicular",
        name: "The funicular",
        kicker: "Access",
        description:
          "The Flying Dutchman funicular runs visitors up the ridge to the old lighthouse, named after the ghost ship of Cape legend. Walkers use the stepped path alongside it.",
        fact: "Flying Dutchman funicular",
        position: [-1.2, 1.9, -0.9],
        focus: [-1.2, 1.4, -0.9],
        distance: 7,
        source: {
          label: "Cape Point",
          url: "https://en.wikipedia.org/wiki/Cape_Point",
        },
      },
    ],
    sources: [
      { label: "Cape Point", url: "https://en.wikipedia.org/wiki/Cape_Point" },
      {
        label: "Cape of Good Hope",
        url: "https://en.wikipedia.org/wiki/Cape_of_Good_Hope",
      },
      {
        label: "Table Mountain National Park",
        url: "https://www.sanparks.org/parks/table-mountain",
      },
    ],
  },
  {
    slug: "augrabies",
    name: "Augrabies Falls",
    province: "Northern Cape",
    title: "The great noise",
    tagline: "A river dropping into a granite gorge",
    description:
      "The Orange River gathers pace across the Northern Cape plateau, then drops about 56 metres into a gorge of augrabies granite. The Khoi name for the place, Aukoerebis, means place of great noise, and at flood the spray carries a long way.",
    accent: "#c0753a",
    accentSoft: "#efc79a",
    sky: "#f6e9d8",
    landmarks: [
      {
        id: "the-falls",
        name: "The falls",
        kicker: "Water",
        description:
          "The river breaks into several channels as it reaches the lip, then falls in sheets over the granite edge. The best-known drop is around 56 metres, though the total fall through the gorge is much greater.",
        fact: "About 56 m · Orange River (Gariep)",
        position: [1.1, 1.35, 0.5],
        focus: [0.3, 1.0, 0.5],
        distance: 8,
        source: {
          label: "Augrabies Falls",
          url: "https://en.wikipedia.org/wiki/Augrabies_Falls",
        },
      },
      {
        id: "the-gorge",
        name: "The gorge",
        kicker: "Geology",
        description:
          "Below the falls the river runs through a narrow, steep-sided gorge cut into ancient granite. In places the walls rise some 240 metres above the water.",
        fact: "Gorge walls up to about 240 m",
        position: [0.6, 0.55, 2.3],
        focus: [0.5, 0.3, 2.1],
        distance: 8,
        source: {
          label: "Augrabies Falls National Park",
          url: "https://www.sanparks.org/parks/augrabies",
        },
      },
      {
        id: "the-viewpoint",
        name: "The viewpoint",
        kicker: "Access",
        description:
          "Walkways and decks on the northern bank put visitors above the lip of the falls. The surrounding park protects arid Nama-Karoo vegetation, including quiver trees and klipspringer on the rocks.",
        fact: "Nama-Karoo vegetation · quiver trees",
        position: [-1.5, 2.1, 0.3],
        focus: [-2.6, 1.9, -1.2],
        distance: 7.5,
        source: {
          label: "Augrabies Falls National Park",
          url: "https://www.sanparks.org/parks/augrabies",
        },
      },
    ],
    sources: [
      { label: "Augrabies Falls", url: "https://en.wikipedia.org/wiki/Augrabies_Falls" },
      {
        label: "Augrabies Falls National Park",
        url: "https://www.sanparks.org/parks/augrabies",
      },
      { label: "Orange River", url: "https://en.wikipedia.org/wiki/Orange_River" },
    ],
  },
  {
    slug: "boulders",
    name: "Boulders Beach",
    province: "Western Cape",
    title: "The penguin cove",
    tagline: "Granite, sand and a colony of penguins",
    description:
      "Huge rounded granite boulders break the swell at Simon's Town, leaving a string of sheltered coves and warm sand. African penguins began nesting here in 1982 and the colony has been managed by SANParks ever since, with boardwalks keeping visitors above the birds.",
    accent: "#1f8ba3",
    accentSoft: "#a6d8de",
    sky: "#e6f3f4",
    landmarks: [
      {
        id: "the-boulders",
        name: "The boulders",
        kicker: "Geology",
        description:
          "Rounded granite outcrops, weathered along joints into the smooth, stacked forms that give the beach its name. The same granite underlies much of the Cape Peninsula.",
        fact: "Cape granite · weathered into rounded forms",
        position: [1.7, 0.7, 0.7],
        focus: [1.7, 0.5, 0.7],
        distance: 7,
        source: {
          label: "Boulders Beach",
          url: "https://en.wikipedia.org/wiki/Boulders_Beach",
        },
      },
      {
        id: "penguin-colony",
        name: "The penguin colony",
        kicker: "Wildlife",
        description:
          "African penguins, also called jackass penguins for their braying call, nest in burrows and under bushes above the tide line. The species is endangered, and the Boulders colony is one of the few that visitors can approach closely.",
        fact: "African penguin · endangered",
        position: [0.4, 0.4, 1.2],
        focus: [0.5, 0.15, 1.5],
        distance: 6.5,
        source: {
          label: "African penguin",
          url: "https://en.wikipedia.org/wiki/African_penguin",
        },
      },
      {
        id: "the-boardwalk",
        name: "The boardwalk",
        kicker: "Access",
        description:
          "Timber walkways thread through the coastal thicket and over the sand, so that people and penguins keep their distance. The beach is part of Table Mountain National Park.",
        fact: "Table Mountain National Park",
        position: [-2.9, 1.0, 0.1],
        focus: [-2.3, 0.5, 0.1],
        distance: 7,
        source: {
          label: "Table Mountain National Park",
          url: "https://www.sanparks.org/parks/table-mountain",
        },
      },
    ],
    sources: [
      { label: "Boulders Beach", url: "https://en.wikipedia.org/wiki/Boulders_Beach" },
      { label: "African penguin", url: "https://en.wikipedia.org/wiki/African_penguin" },
      {
        label: "Table Mountain National Park",
        url: "https://www.sanparks.org/parks/table-mountain",
      },
    ],
  },
  {
    slug: "robben-island",
    name: "Robben Island",
    province: "Western Cape",
    title: "The island prison",
    tagline: "A flat island in a bright sea",
    description:
      "Robben Island sits in Table Bay, low and windswept, ringed by shallow turquoise water. It has been a whaling station, a leper colony, a military base and a prison; Nelson Mandela spent eighteen of his twenty-seven years in custody in its maximum-security prison. It is now a museum and a UNESCO World Heritage Site.",
    accent: "#3f7f8c",
    accentSoft: "#b5d6d3",
    sky: "#e8f0ec",
    landmarks: [
      {
        id: "maximum-security-prison",
        name: "The prison",
        kicker: "History",
        description:
          "The maximum-security prison held political prisoners from the 1960s. Nelson Mandela was imprisoned here from 1964 to 1982, much of it in a cell on B block, and the island's limestone quarry is part of the same history.",
        fact: "Mandela held here 1964–1982",
        position: [0.2, 0.75, 0.1],
        focus: [0.2, 0.5, 0.1],
        distance: 8,
        source: {
          label: "Robben Island",
          url: "https://en.wikipedia.org/wiki/Robben_Island",
        },
      },
      {
        id: "the-lighthouse",
        name: "The lighthouse",
        kicker: "Navigation",
        description:
          "The island's lighthouse was built in the nineteenth century and is one of the oldest on the South African coast. Its light warns shipping away from the shallow water around the island.",
        fact: "One of South Africa's oldest lights",
        position: [-2.05, 1.4, -1.45],
        focus: [-2.0, 0.7, -1.4],
        distance: 7,
        source: {
          label: "Robben Island",
          url: "https://en.wikipedia.org/wiki/Robben_Island",
        },
      },
      {
        id: "murray-harbour",
        name: "Murray's Harbour",
        kicker: "Access",
        description:
          "The harbour on the east side is where the ferry from the V&A Waterfront ties up and where fishing boats once worked the bay. A stone breakwater shelters the small basin.",
        fact: "Ferry from the V&A Waterfront",
        position: [2.5, 0.4, 0.8],
        focus: [2.5, 0.2, 0.7],
        distance: 6.5,
        source: {
          label: "Robben Island Museum",
          url: "https://www.robben-island.org.za/",
        },
      },
    ],
    sources: [
      { label: "Robben Island", url: "https://en.wikipedia.org/wiki/Robben_Island" },
      {
        label: "Robben Island — UNESCO",
        url: "https://whc.unesco.org/en/list/916/",
      },
      { label: "Robben Island Museum", url: "https://www.robben-island.org.za/" },
    ],
  },
  {
    slug: "kosi-bay",
    name: "Kosi Bay",
    province: "KwaZulu-Natal",
    title: "The estuary lakes",
    tagline: "Mangroves, dunes and a tidal channel",
    description:
      "Four linked lakes drain to the sea through a winding, sandy channel at the northern edge of iSimangaliso Wetland Park. Mangroves root in the shallows, raffia palms line the dunes, and families still fish with reed traps that have been in use for generations.",
    accent: "#3f8f6f",
    accentSoft: "#b9dcc4",
    sky: "#eaf3e3",
    landmarks: [
      {
        id: "the-estuary",
        name: "The estuary channel",
        kicker: "Water",
        description:
          "The channel between the lakes and the Indian Ocean shifts with every flood and tide. Its sandy bed and slow current make the water read as a band of green and turquoise.",
        fact: "Four interconnected lakes",
        position: [1.7, 0.3, 0.6],
        focus: [0.7, 0.1, 1.4],
        distance: 7.5,
        source: {
          label: "Kosi Bay",
          url: "https://en.wikipedia.org/wiki/Kosi_Bay",
        },
      },
      {
        id: "mangroves",
        name: "The mangroves",
        kicker: "Plants",
        description:
          "Five species of mangrove grow in the Kosi system, their stilt roots trapping sediment and sheltering juvenile fish. The trees are the reason the water stays clear and the banks keep building.",
        fact: "Five mangrove species",
        position: [1.9, 0.45, -0.5],
        focus: [1.9, 0.35, -0.5],
        distance: 7,
        source: {
          label: "Mangrove",
          url: "https://en.wikipedia.org/wiki/Mangrove",
        },
      },
      {
        id: "the-dunes",
        name: "The dunes",
        kicker: "Coast",
        description:
          "High, pale dunes run behind the beach, held together by scrub and raffia palm. Loggerhead and leatherback turtles nest on this coast in summer.",
        fact: "iSimangaliso Wetland Park · UNESCO",
        position: [-3.2, 2.4, -2.2],
        focus: [-2.8, 1.7, -1.8],
        distance: 8,
        source: {
          label: "iSimangaliso Wetland Park",
          url: "https://whc.unesco.org/en/list/914/",
        },
      },
    ],
    sources: [
      { label: "Kosi Bay", url: "https://en.wikipedia.org/wiki/Kosi_Bay" },
      {
        label: "iSimangaliso Wetland Park — UNESCO",
        url: "https://whc.unesco.org/en/list/914/",
      },
      { label: "Mangrove", url: "https://en.wikipedia.org/wiki/Mangrove" },
    ],
  },
  {
    slug: "addo",
    name: "Addo",
    province: "Eastern Cape",
    title: "The waterhole",
    tagline: "Thicket, dust and a herd at the water",
    description:
      "Addo Elephant National Park began in 1931 with a handful of survivors and now holds one of the densest elephant populations in Africa. Spekboom thicket covers the rolling hills, a red dirt road loops through the bush, and the waterhole pulls herds in through the day.",
    accent: "#a4733f",
    accentSoft: "#dcc09a",
    sky: "#f1ecdf",
    landmarks: [
      {
        id: "the-waterhole",
        name: "The waterhole",
        kicker: "Wildlife",
        description:
          "Pumped water keeps a dependable supply through the dry season. Elephants drink in family groups, and the mud around the edge is used for dusting and cooling.",
        fact: "Over 600 elephants in the park",
        position: [0.4, 0.45, 1.1],
        focus: [0.4, 0.15, 1.1],
        distance: 7.5,
        source: {
          label: "Addo Elephant National Park",
          url: "https://en.wikipedia.org/wiki/Addo_Elephant_National_Park",
        },
      },
      {
        id: "the-herd",
        name: "The herd",
        kicker: "Wildlife",
        description:
          "Elephant family groups are led by the oldest cows. Addo's elephants are the only ones in the region with a documented history of tuskless females, a legacy of heavy hunting before protection.",
        fact: "Proclaimed 1931 · 11 elephants left",
        position: [-0.3, 1.7, -0.7],
        focus: [-0.3, 0.35, -0.7],
        distance: 7,
        source: {
          label: "Addo Elephant National Park",
          url: "https://en.wikipedia.org/wiki/Addo_Elephant_National_Park",
        },
      },
      {
        id: "the-loop-road",
        name: "The loop road",
        kicker: "Access",
        description:
          "Gravel loops carry self-drive visitors through the thicket. The red earth of the Eastern Cape stains the roads and the vehicles that use them.",
        fact: "Spekboom thicket · self-drive loops",
        position: [2.0, 1.3, -1.5],
        focus: [2.3, 0.9, -1.2],
        distance: 7,
        source: {
          label: "Addo Elephant National Park",
          url: "https://www.sanparks.org/parks/addo",
        },
      },
    ],
    sources: [
      {
        label: "Addo Elephant National Park",
        url: "https://en.wikipedia.org/wiki/Addo_Elephant_National_Park",
      },
      { label: "Addo — SANParks", url: "https://www.sanparks.org/parks/addo" },
      { label: "African elephant", url: "https://en.wikipedia.org/wiki/African_bush_elephant" },
    ],
  },
  {
    slug: "valley-of-desolation",
    name: "Valley of Desolation",
    province: "Eastern Cape",
    title: "The dolerite pillars",
    tagline: "Columns above the Karoo plain",
    description:
      "Dolerite pillars climb out of the hillside above Graaff-Reinet, formed when molten rock intruded the Karoo sediments and then weathered into columns. From the edge of the cliff the Great Karoo opens out in every direction, dry and enormous.",
    accent: "#a86b3c",
    accentSoft: "#e0c39c",
    sky: "#f4ead9",
    landmarks: [
      {
        id: "the-pillars",
        name: "The pillars",
        kicker: "Geology",
        description:
          "Vertical dolerite columns stand above the slope like broken teeth. Jointing in the intrusive rock guided the weathering, leaving free-standing pillars up to about 120 metres high.",
        fact: "Columns up to about 120 m",
        position: [-0.4, 2.0, -1.4],
        focus: [-0.5, 2.1, -1.0],
        distance: 8,
        source: {
          label: "Valley of Desolation",
          url: "https://en.wikipedia.org/wiki/Valley_of_Desolation",
        },
      },
      {
        id: "the-viewpoint",
        name: "The viewpoint",
        kicker: "Access",
        description:
          "A short walk and a timber deck put visitors at the cliff edge, with the town of Graaff-Reinet and the Sneeuberg beyond. The site sits inside Camdeboo National Park.",
        fact: "Camdeboo National Park",
        position: [-1.7, 2.1, 0.1],
        focus: [-2.4, 1.7, 0.6],
        distance: 7,
        source: {
          label: "Camdeboo National Park",
          url: "https://www.sanparks.org/parks/camdeboo",
        },
      },
      {
        id: "the-karoo",
        name: "The Karoo plain",
        kicker: "Landscape",
        description:
          "Beyond the cliffs the Karoo stretches away as low, dry hills and flats, grazed by sheep and dotted with scrub. The name comes from the Khoi word for dry, hard ground.",
        fact: "Semi-arid Karoo · Succulent Karoo biome",
        position: [2.6, 0.6, 2.2],
        focus: [2.6, 0.4, 2.2],
        distance: 7.5,
        source: {
          label: "Karoo",
          url: "https://en.wikipedia.org/wiki/Karoo",
        },
      },
    ],
    sources: [
      {
        label: "Valley of Desolation",
        url: "https://en.wikipedia.org/wiki/Valley_of_Desolation",
      },
      { label: "Camdeboo National Park", url: "https://www.sanparks.org/parks/camdeboo" },
      { label: "Karoo", url: "https://en.wikipedia.org/wiki/Karoo" },
    ],
  },
];

export const DIORAMA_BY_SLUG = Object.fromEntries(
  DIORAMAS.map((item) => [item.slug, item]),
) as Record<DioramaSlug, DioramaContent>;

export function isDioramaSlug(value: string | undefined | null): value is DioramaSlug {
  return DIORAMAS.some((item) => item.slug === value);
}
