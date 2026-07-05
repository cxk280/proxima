# VIEWS.md — Proxima

This file verbally describes **every possible view** in the Proxima application. It is the source of
truth for the UI/UX. Figma mocks are created from this file and must be approved before any UI coding
begins.

Proxima is a developer platform + SDK. The web app is a **capability showcase**: its job is to make
the "nearest-GPU, sub-40ms anywhere" primitive viscerally obvious. The animated globe is the hero of
every screen it appears on.

---

## Data-provenance contract (applies to every number on every view)

The demo is meant to run on **live, real data** with as little mocked data as possible. To keep that
honest, every value on screen is one of two kinds, and the UI must make which one visible:

- **REAL** — measured live. The viewer's own round-trip latency (their browser → the nearest region's
  probe responder), region health/reachability (derived from live probes), and the voice agent's
  actual response round-trip. Real numbers render in the normal monospace style.
- **EST** (estimated) — physically-honest model, used only where a real measurement is impossible for
  this viewer: latency for *other* cities the viewer isn't physically in, and GPU **inference** time
  (no real GPU is provisioned). EST numbers carry a small "est" tag / dotted underline and a tooltip
  ("estimated — great-circle model") so nothing modeled ever masquerades as measured.

When no region responders are live (outside a demo window), REAL values gracefully fall back to EST
and the whole view shows a subtle "estimated — no live regions attached" note. The app never fabricates
a "measured" number.

---

## Global shell (applies to all views)

- **Top bar:** Proxima wordmark (left) linking to Home. Right side: nav links — *Demo*, *Leaderboard*,
  *Docs* — plus a live **mesh-status pill** whose count and color come from **real** probe health
  (e.g. "6 regions · all healthy", green dot; "6 regions · 1 degraded", amber). Clickable to Mesh Status.
- **Theme:** dark, "mission-control" aesthetic — **deep-navy background** (softer than pure black),
  a single accent (electric cyan) for "live/healthy/sub-40ms", amber for "warning/>40ms", red for
  "down/>200ms". Monospace for all latency numbers so digits don't jitter as they update.
- **Footer:** links to GitHub repo, Docs, and a one-line "Powered by Vultr's 33-region GPU mesh."
- **Responsive:** globe-centric views are desktop-first; below ~900px the globe collapses to a static
  projection with the same region markers and the data panels stack vertically.
- **Connection banner:** if the browser loses the live probe stream, a thin amber banner appears at top
  ("Live data paused — reconnecting…") and latency numbers freeze at their last value (dimmed).

---

## 1. Home / Landing

The marketing-grade first impression. One screenful, no scrolling required to get the pitch.

- **Hero:** headline "Sub-40ms AI. Anywhere on Earth." Subhead: one sentence on the 33-region GPU
  mesh. Primary CTA "Try the live demo" → Voice-Agent Demo. Secondary CTA "Read the docs" → Docs.
- **Live globe (hero visual):** the animated globe, slowly rotating, with all active regions marked as
  cyan dots. On load it auto-detects the visitor's approximate origin and, in the browser, **measures
  the viewer's REAL round-trip** to the nearest region responder, drawing an animated arc from origin
  to the region that answered with that measured RTT floating at the midpoint ("24ms"). If no responders
  are live, the arc shows an EST value with the "est" tag.
- **Trust strip:** three compact stat tiles — "33 regions", "90% of humanity within 40ms",
  "$0.032/hr per region" — reinforcing the Vultr capability.
- **Empty/loading state:** globe renders immediately with region dots; the origin→region arc and RTT
  animate in once the first real measurement returns. If geolocation is denied, default origin is
  "your IP region" with a subtle note; the measured RTT is still real from the viewer's device.

## 2. Voice-Agent Demo (the primary demo)

The reference real-time voice agent that proves the latency claim in a felt, interactive way. This is
the most "live and editable" view: the viewer changes inputs and watches real data respond.

- **Layout:** globe on the left/center as the hero; a control + transcript panel on the right.
- **Globe behavior:** pulses on the currently-homed region; shows the live origin→region arc with a
  continuously-updating RTT badge. When the session re-homes to a different region, the old arc fades
  and a new one draws with a satisfying transition.
- **Origin selector (viewer-editable):** a chip row — ***Auto · my location*** first, then *Nairobi*,
  *Jakarta*, *Santiago*, *São Paulo*, *Sydney*, etc.
  - **Auto · my location = REAL:** the viewer's browser measures live RTT to every reachable region
    responder, homes to the nearest, and shows *their own* real number. This is the headline.
  - **Other cities = EST:** shown with the "est" tag — "what a user in <city> would see," from the
    honest great-circle model, since the viewer isn't physically there.
- **Region control (viewer-editable):** the viewer can also pick a specific region to home to (not just
  the nearest), to see how latency changes — the globe re-draws and the RTT (REAL for their location)
  updates.
- **Push-to-talk control + REAL voice:** a large mic button. States: idle, listening (animated
  waveform), thinking (spinner), speaking (agent audio playing). The agent is **really Claude-powered**:
  the utterance is transcribed, sent to the model, and the reply streams back. Below the button, a live
  **round-trip readout** breaks the real measured turn into **network (REAL)** vs **inference (EST,
  labeled)** — network is the viewer's real path; inference time is modeled since there's no real GPU.
- **"US-East only" toggle (the contrast):** flipping this pins all traffic to a single US region.
  Now distant origins (and, for a viewer far from US-East, their *own* real number) visibly blow past
  200ms — the arc turns red, the RTT badge goes red, and a callout explains "This is what single-region
  GPU hosting feels like." Flipping back restores sub-40ms.
- **States:** mic-permission-denied (explain + retry), no-capacity-in-region (auto-fails over to next
  nearest healthy region per **live** health, shown as a brief re-home animation + a system transcript
  note), agent-error (inline retry).

## 3. Leaderboard — "Sub-40ms Anywhere"

Shows origins around the world landing under 40ms — with the viewer's own city as the one REAL row.

- **Table/board:** one row per origin city. Columns: origin city, region that answered, RTT (monospace),
  a horizontal latency bar (green under 40ms), status. The viewer's own location appears as a pinned
  **"You — REAL"** row at the top with their live measured RTT; the other city rows are **EST** (tagged),
  from the honest model.
- **Run control:** a "Run probes" button that fires the whole set; rows animate in as each returns. A
  summary header shows "12/12 under 40ms" with the max observed RTT, and notes how many rows are REAL
  vs EST.
- **Companion globe:** small globe showing all arcs lit simultaneously; the viewer's real arc is
  emphasized.
- **Contrast mode:** a "Single-region (US-East)" toggle re-routes to one region; distant rows (and the
  viewer's own, if far) go amber/red and the summary flips.
- **States:** probing (per-row spinners), a probe timeout/failure (row marked red with reason), all-
  complete (summary + a subtle celebratory accent when all pass).

## 4. Mesh Status

Operational view of the **live** mesh — reachable from the top-bar status pill. Health here is REAL,
derived from probe reachability + measured RTT, not a hardcoded table.

- **Region list:** every active region with: city/label, **live** health (healthy/degraded/down from
  real probes), current capacity, in-region load-balancer status, and a recent-RTT sparkline built from
  real samples. Regions with a live responder show a REAL badge; regions with no responder attached show
  as EST/model.
- **Globe:** regions colored by real health (cyan healthy, amber degraded, red down).
- **Detail-on-select:** clicking a region opens a panel with its GPU type (fractional A16, labeled est),
  recent real probe history, and last-failover event if any.
- **States:** all-healthy (default), degraded (amber region + banner), region-down (red region, and if
  it was serving traffic, a note showing where sessions failed over to), empty (no regions
  provisioned — "Provision a region to begin" with a docs link).

## 5. Docs / SDK

Developer-facing documentation for the `connect()` SDK.

- **Quickstart:** install snippet, a minimal `connect()` → nearest-region session code sample, and the
  single endpoint developers point at.
- **API reference:** `connect()` options, session lifecycle, failover behavior, how nearest-region
  selection works (real latency probes + health).
- **Copy-to-clipboard** on every code block; language tabs where relevant.
- **Live "try it" callout** linking back to the Voice-Agent Demo.
- **States:** default; copy-confirmation toast on snippet copy.

## 6. Error / fallback views

- **404 / unknown route:** globe with a dimmed origin arc going nowhere, "This route didn't route.
  Back to Home."
- **Global data outage:** if the probe backend is unreachable, a full-view state explaining live data
  is unavailable, with a retry and a link to Mesh Status.

---

## View inventory (index)

1. Home / Landing
2. Voice-Agent Demo
3. Leaderboard — "Sub-40ms Anywhere"
4. Mesh Status
5. Docs / SDK
6. Error / fallback views

> Next: create Figma mocks from these descriptions and get user approval **before** any UI coding
> (global rule), then run `/factory` per feature to build. Feature slices toward "live real data":
> (1) client-side real per-user latency + viewer-editable region, (2) live region health from probes,
> (3) real Claude-powered voice agent. GPU inference stays modeled but labeled "est".
