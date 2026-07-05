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

The web app is a **Next.js (App Router) + TypeScript + Tailwind CSS v4** project. The views
consume latency data from a **real probe backend** (route handlers under `app/api/`) via the
**`@proxima/connect` SDK** (`lib/sdk`) — origin is geo-located from the request IP and the
wire RTT to the edge is really measured, while per-region GPU latency is modeled server-side
(great-circle distance → fibre propagation) until real Vultr regions are wired in. See
[Live backend + SDK](#live-backend--sdk) below.

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
| `app/` | App Router pages — Home, Demo, Leaderboard, Mesh Status, Docs, and the 404 / error fallbacks |
| `app/api/` | The probe backend — `probe`, `probe/batch`, `regions`, `mesh`, `health`, and the `session` SSE stream |
| `components/globe/` | The reusable animated wireframe `Globe` (SVG, SSR-safe) |
| `components/shell/` | Global chrome — `TopBar`, `Footer`, `ConnectionBanner`, `Shell` |
| `components/{home,demo,leaderboard,mesh,docs}/` | The five views |
| `lib/sdk/` | The `@proxima/connect` SDK — `connect()` live session + `probeOnce`/`probeBatch`/`fetchRegions`/`fetchMeshStatus` |
| `lib/mesh/` | Region catalog, geo/projection math, the latency model, and the `server-probe` real-region seam |

### Live backend + SDK

The UI never computes latency itself — it calls the backend through the SDK:

| Endpoint | Purpose |
|---|---|
| `POST /api/probe` | Home a session onto the nearest region (origin from body or geo-IP) |
| `POST /api/probe/batch` | Probe many origins at once (the leaderboard sweep) |
| `GET /api/regions` | The region catalog |
| `GET /api/mesh` | Operational status snapshot (Mesh Status) |
| `GET /api/health` | Liveness for the connection banner |
| `GET /api/session` | **SSE** live RTT stream a `connect()` session subscribes to |

**What's real vs modeled:** the origin is geo-located from real edge headers (`x-vercel-ip-*` /
`cf-ip*`; falls back to a coarse default on localhost), and the SDK measures the real wire RTT
to the edge. Per-region GPU latency is a **model** (great-circle distance → fibre propagation)
so the numbers are honest estimates, not fabricated.

**Plugging in real Vultr regions:** set `PROXIMA_REGION_ENDPOINTS` to a JSON map of
`regionId → probe URL`. When present, `lib/mesh/server-probe.ts` measures the *real*
round-trip to the nearest region's endpoint instead of modeling it — no UI changes needed.

```bash
PROXIMA_REGION_ENDPOINTS='{"fra":"https://fra.probe.example/health","nrt":"https://nrt.probe.example/health"}' npm run dev
```
