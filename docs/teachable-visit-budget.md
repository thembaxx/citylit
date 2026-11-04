# Teachable figures · visit-time budget
**Claim:** With a fixed amount of time, additional stops or travel consume the remaining visit budget.
**Misconception:** Extra stops cost only time at the venue, not the travel between places.
**Learning loop:** Predict → change stop count and times → inspect segmented budget → explain → transfer.
**Truth model:** visits = stops × minutes per visit; travel = (stops − 1) × minutes per leg; available = max(0, budget − visits − travel). This is an *illustrative* scenario, not an actual CityLit itinerary or live route estimate.
**Constraints:** Does not modify saved plans, inferred opening times, maps or any existing route service. Keeps the established feasibility planner authoritative.
**Placement:** Optional collapsed experiment in the existing city day-planning section; default content stays uncluttered.
**Privacy:** No data persisted by the figure.
Inspired by https://github.com/ywEdAi/teachable-figures; code is original. Check on 320px, 390px, and desktop. Test keyboard, dark/light, no autoplay, plus CI checks.
