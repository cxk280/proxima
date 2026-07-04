# Proxima — Global sub-40ms edge-AI mesh

**Proxima** is a developer platform + SDK that routes every interactive-AI session to the nearest of
Vultr's 33 GPU regions, guaranteeing sub-40ms response **anywhere on Earth** instead of only in
US/EU. It serves real-time AI products — voice agents, live AR, game NPCs — that need to feel instant
for a genuinely global user base.

**Vultr capability this proves:** a 33-region GPU mesh reaching 90% of the world's population within
2–40ms — a geographic footprint of *GPU* capacity that hyperscalers don't have.

## Cost estimate (tight budget)

The routing/latency story doesn't need beefy GPUs — the demo is about *where* compute runs, not model
size — so the **cheapest fractional A16 at ~$0.032/hr** per region is plenty.

| Item | Rate | Notes |
|---|---|---|
| Fractional A16 GPU × ~4 regions | ~$0.032/hr each (~$0.13/hr total) | The mesh; hourly, destroyed after the demo |
| Router / dashboard host (Cloud Compute) | ~$0.01/hr (~$5–10/mo) | Globe UI + geo-routing tier |
| **~4-hour demo session** | **≈ $1–3 total** | |

Start with 3–4 regions to keep it cheap; the region list scales later. **Destroy the GPU slices when
not in use.**

See [`PLAN.md`](./PLAN.md) for the full concept and build plan, and [`VIEWS.md`](./VIEWS.md)
for the source-of-truth description of every view.

## Development

The web app is a **Next.js (App Router) + TypeScript + Tailwind CSS v4** project. The live
latency/globe data is currently a **deterministic simulated provider** (`lib/mesh`) behind a
`MeshProvider` interface — no GPU spend, demo-ready — designed so a real probe backend +
`connect()` SDK can drop in later without touching the UI.

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

```bash
npm run build        # production build
npm run typecheck    # tsc --noEmit
npm run lint         # next lint
npm test             # vitest (data-layer + region-selection unit tests)
npm run format       # prettier --write .
```

### Project layout

| Path | What |
|---|---|
| `app/` | App Router pages — Home (`page.tsx`) plus stubbed `demo` / `leaderboard` / `mesh` / `docs` routes |
| `components/globe/` | The reusable animated wireframe `Globe` (SVG, SSR-safe) |
| `components/shell/` | Global chrome — `TopBar`, `Footer`, `ConnectionBanner`, `Shell` |
| `components/ui/` | Primitives — `Button`, `StatTile`, `MeshPill` |
| `lib/mesh/` | Region catalog, geo/projection math, and the simulated probe provider |
