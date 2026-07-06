# Proxima — Global sub-40ms edge-AI mesh

## Elevator pitch

Proxima turns Vultr's 33 GPU regions into a single "nearest-GPU" primitive. A developer points their
interactive-AI app at one Proxima endpoint; Proxima routes each session to the closest region with
capacity and guarantees a sub-40ms round trip regardless of where on Earth the user is. It ships as a
thin **SDK** plus a reference voice-agent demo.

**The core idea:** a 33-region, 2–40ms-to-90%-of-humanity GPU mesh — the "latency-honest
everywhere" primitive that hyperscaler geography can't deliver for GPU workloads.

## Target user / niche & why hyperscalers can't serve it

Builders of real-time AI — live voice agents, conversational NPCs, AR overlays — whose users are
global, not just North American/European. On hyperscalers, GPU inference concentrates in a handful of
US/EU regions, so a user in Lagos, Jakarta, or Santiago eats 200ms+ of network latency before the
model even runs. Proxima's whole value is being physically close everywhere at once, which requires
Vultr's uniquely broad GPU footprint.

## Architecture

- **Compute:** Vultr **Cloud GPU** deployed across many regions running an identical inference image.
- **Routing:** a geo/latency-aware routing tier (anycast or a lightweight router + health/latency
  probes) that selects the nearest healthy region per session; **Load Balancers** in-region.
- **SDK:** a small client library (`connect()` → nearest-region session) + a reference voice agent.
- **Making it visible:** an animated **globe** that lights up whichever of the 33 regions answered
  you, annotated with measured RTT, plus a **"sub-40ms anywhere" leaderboard** that fires probes from
  simulated global origins and shows every one landing under 40ms.

## Demo script (~60s)

1. Open the demo voice agent; the globe pulses on your nearest region with its RTT (e.g. "24ms").
2. Switch your simulated origin to Nairobi, then Jakarta, then Santiago — the globe re-homes to a new
   region each time, RTT staying under 40ms.
3. Run the leaderboard: probes from a dozen global cities, all green/sub-40ms.
4. Contrast with a "US-East only" toggle where distant origins blow past 200ms.

## Next steps for the build Claude

1. Author **`VIEWS.md`** (globe/latency dashboard, voice-agent demo, leaderboard, SDK/docs page).
2. Create **Figma mocks** and get user approval **before any UI coding** (global rule).
3. Run **`/factory`** to build end-to-end into a reviewable PR.
4. Start with 3–4 regions + the routing tier + globe, then scale the region list. The globe is the hero.
