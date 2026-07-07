# DEMO.md — presenting Proxima live

A pull-it-up-during-the-call runbook for demoing the deployed app. Optimized for
a **screen-share over a video call** (Zoom/Meet), where the microphone is already
in use — so the demo is driven by **typing**, not the browser mic.

## URLs

| URL | Notes |
|---|---|
| **https://155-138-214-114.sslip.io** | The one to present. Padlock (trusted HTTPS); mic **and** type-to-send both work. |
| **http://155.138.214.114** | Raw IP. Convenient to share, but plain HTTP → Chrome shows "Not secure" and the browser mic is disabled. Type-to-send still works. |

Present from the **HTTPS URL** — the padlock reads more credible on a share.

## Pre-flight (run ~30 min before)

```bash
S="https://155-138-214-114.sslip.io"
curl -s -o /dev/null -w "app: %{http_code} (%{time_total}s)\n" "$S/"
curl -s "$S/api/health" | jq -c '{regions,healthy,degraded,down,real}'
curl -s -X POST "$S/api/chat" -H 'content-type: application/json' \
  -d '{"messages":[{"role":"user","content":"say hi"}]}' | jq -c '{real}'
```

Want: **app 200**, **6 healthy / 0 down**, voice **`real:true`**. A single transient
`down` can appear right after a redeploy (cold probe) — re-run; it settles.

Then open the HTTPS URL in the **exact browser window** you'll present from, so the
Let's Encrypt cert is warm and the tab is ready.

## Driving the demo (no microphone)

The voice panel on **/demo** has a **text box** under the mic button. Type a prompt,
hit **Send** — it goes to the real Claude agent across the mesh and the reply appears
in the transcript tagged `REAL`. **Speaker output is off by default** (`🔇 Speak
replies`), so nothing plays through your speakers to echo into the call. Flip it to
`🔊` only if you *want* the audience to hear the spoken reply.

> Why not the mic? On a call the mic is captured by Zoom, and the agent's text-to-speech
> would feed back into the call audio. Typing sidesteps both while keeping the round-trip
> real.

## Flow (~60–90s)

1. **Home / globe** — lands on your nearest region with a real, measured RTT.
2. **Switch origin** (Nairobi → Jakarta → Santiago) — the globe re-homes each time, RTT stays sub-40ms.
3. **Leaderboard** — probes from a dozen global cities, all green / sub-40ms.
4. **"US-East only" toggle** — distant origins blow past 200ms. The money shot: single-region GPU hosting vs. the mesh.
5. **Voice agent (/demo)** — type a question in the box → real Claude answers in the transcript.
6. **Mesh Status** — 6 regions, health from live probes (tagged REAL, not modeled).

**Talking point:** every number is tagged **REAL vs EST** honestly — latency is measured
from the viewer's own browser, not faked. That provenance is the credibility of the whole thing.

## Fail-safes

- **Bad venue wifi?** RTTs are measured live from your laptop, so they reflect real
  network. If wifi is rough, **tether to your phone** for cleaner numbers.
- **A region shows degraded/down?** That's honest live health — fine to leave, or refresh
  the fleet (below). Don't try to force all-green; "90% of humanity" is the honest claim.
- **Voice error / no key?** The agent falls back to a scripted reply (tagged, not `REAL`).
  It still talks; nothing breaks on stage.
- **Don't redeploy right before the demo** unless something's actually broken.

## Redeploy (only if needed)

Regions are made real by passing the endpoints JSON — it is **not** stored in a file, so a
bare `app-deploy.sh` reverts regions to *modeled*. Read the current JSON back off the host,
then redeploy with it:

```bash
EP=$(ssh root@155.138.214.114 'grep -oP "(?<=PROXIMA_REGION_ENDPOINTS=).*" /opt/proxima/.env')
./deploy/app-deploy.sh "$EP"      # keeps regions real; carries the Anthropic key from deploy/.env
```

The live fleet is currently a single region (`bom`); the others were torn down to free
Vultr quota. To boot fresh responders, pass whichever regions you want, e.g.
`./deploy/probes-up.sh bom fra nrt`, then paste its printed JSON into `app-deploy.sh`.

## Teardown (after the demo)

```bash
./deploy/probes-down.sh           # kills the probe fleet (tag proxima-probe only)
```

Stops the hourly probe cost. The app host (~$5–6/mo) can stay up for a live LinkedIn link,
or be destroyed in the Vultr dashboard for $0.
