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

See [`PLAN.md`](./PLAN.md) for the full concept and build plan.
