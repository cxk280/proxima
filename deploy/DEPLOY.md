# Deploying Proxima on Vultr (tight-budget playbook)

The app runs fully with **modeled** latency, so "deploy" is a dial you turn up
region-by-region. Two moving parts:

- **App host** — one always-on instance running the Next.js app. **~$5–6/mo.**
- **Probe responders** — tiny non-GPU boxes that make a region's wire-RTT *real*.
  On-demand, **~$0.004–0.005/hr each** (~$0.06 for a 2-hour, 6-region demo).

No GPUs. No paid domain (free HTTPS via `sslip.io`). New Vultr accounts usually
have promo credit that covers the first month outright.

## 0. One-time setup

```bash
cp deploy/.env.example deploy/.env
# edit deploy/.env → paste VULTR_API_KEY   (gitignored; never committed)
./deploy/verify.sh          # read-only key check — creates & costs nothing
```

`verify.sh` prints your balance and how many mesh regions map to a Vultr region.

## 1. Stand up the app host (always-on, ~$5–6/mo)

```bash
./deploy/app-deploy.sh          # provisions once, then deploys the app
```

Prints `https://<ip>.sslip.io`. First hit takes ~30s while Caddy fetches a
Let's Encrypt cert (needed so the voice demo's mic permission works — mic
requires HTTPS). Re-running this reuses the same host and ships a fresh build.

## 2. Make regions real for a demo (on-demand, pennies)

Pick a handful of regions that prove "sub-40ms" for your audience's geography —
not all 33. Codes are the airport-style mesh ids (`fra nrt gru syd ewr sjc …`).

```bash
./deploy/probes-up.sh fra nrt gru ewr     # boots responders, prints JSON
```

Copy the printed `PROXIMA_REGION_ENDPOINTS` JSON and push it to the app host:

```bash
./deploy/app-deploy.sh '{"fra":"http://1.2.3.4","nrt":"http://5.6.7.8", ...}'
```

Those regions now show **measured** RTT; every other region stays modeled.

## 3. Stop the meter after the demo

```bash
./deploy/probes-down.sh         # destroys ALL probe responders (idempotent)
```

The app host keeps running (that's your $5–6/mo). To take *everything* down,
also delete the `proxima-app` instance from the Vultr dashboard.

## Cost cheat-sheet

| Item | Rate | Typical |
|---|---|---|
| App host (always-on) | ~$5–6/mo | the only recurring cost |
| Probe responder | $0.004–0.005/hr each | 6 regions × 2 hrs ≈ **$0.06** |
| GPU inference | *not used* | $0 |

**Budget guardrails:** the only forgettable cost is a probe left running —
`probes-down.sh` kills all of them in one shot. Set a spend alert in the Vultr
dashboard as a backstop, and apply any account promo credit.

## Notes / limits

- Real per-region GPU *inference* (Tier 3) is intentionally out of scope — the
  demo is about network proximity, which the responders prove honestly.
- Behind a raw VPS there are no edge geo-IP headers, so the "Auto · my location"
  origin falls back to a default city; the city chips drive the demo. Wiring a
  geo-IP lookup is a later enhancement.
