export const brand = {
  name: "Citylit",
  promise: "Every city has a spark.",
  invitation: "Follow a little curiosity.",
  mascot: "Khwezi",
  story: "A curious springhare collecting little sparks from places worth discovering.",
  colors: {
    ivory: "#F3EFE3",
    ink: "#17243C",
    electric: "#6558F5",
    blush: "#E9B2BA",
    amber: "#F3C975",
  },
} as const;
export const khweziMoments = {
  welcome: { title: "Every city has a spark.", text: "I’m Khwezi. Let’s find yours." },
  gesture: {
    title: "Follow a little curiosity.",
    text: "Drag to turn. Pinch to get closer. Choose a province to begin.",
  },
  saved: {
    title: "A spark for later.",
    text: "Saved to your discoveries, ready for your next little adventure.",
  },
  search: {
    title: "Somewhere worth finding.",
    text: "Try another word or clear your filters. Curiosity takes a few detours.",
  },
  offline: {
    title: "Your sparks travel with you.",
    text: "Downloaded discoveries are ready, even when the signal wanders.",
  },
  loading: { title: "Gathering a little light…", text: "Your next discovery is taking shape." },
} as const;
export type KhweziPose = keyof typeof khweziMoments | "idle";
