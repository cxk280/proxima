# VIEWS.md — Proxima

This file verbally describes **every possible view** in the Proxima application. It is the source of
truth for the UI/UX. Figma mocks are created from this file and must be approved before any UI coding
begins.

Proxima is a developer platform + SDK. The web app is a **capability showcase**: its job is to make
the "nearest-GPU, sub-40ms anywhere" primitive viscerally obvious. The animated globe is the hero of
every screen it appears on.

---

## Global shell (applies to all views)

- **Top bar:** Proxima wordmark (left) linking to Home. Right side: nav links — *Demo*, *Leaderboard*,
  *Docs* — plus a live **mesh-status pill** (e.g. "4 regions · all healthy", green dot) that is
  clickable to the Mesh Status view.
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
  cyan dots. On load it auto-detects the visitor's approximate origin and draws an animated arc from
  that origin to the region that answered, with the measured RTT floating at the midpoint ("24ms").
- **Trust strip:** three compact stat tiles — "33 regions", "90% of humanity within 40ms",
  "$0.032/hr per region" — reinforcing the Vultr capability.
- **Empty/loading state:** globe renders immediately with region dots; the origin→region arc and RTT
  animate in once the first probe returns. If geolocation is denied, default origin is "your IP
  region" with a subtle note.

## 2. Voice-Agent Demo (the primary demo)

The reference real-time voice agent that proves the latency claim in a felt, interactive way.

- **Layout:** globe on the left/center as the hero; a control + transcript panel on the right.
- **Globe behavior:** pulses on the currently-homed region; shows the live origin→region arc with a
  continuously-updating RTT badge. When the session re-homes to a different region, the old arc fades
  and a new one draws with a satisfying transition.
- **Origin selector:** a dropdown / chip row of simulated origins — *Auto (my location)*, *Nairobi*,
  *Jakarta*, *Santiago*, *São Paulo*, *Sydney*, etc. Selecting one re-homes the session; the globe
  re-draws and the RTT badge updates, staying under 40ms.
- **Push-to-talk control:** a large mic button. States: idle, listening (animated waveform), thinking
  (spinner), speaking (agent audio playing). Below it, a live **round-trip readout**: mic→region→back
  in ms, broken into network vs inference.
- **Transcript panel:** rolling transcript of user utterances and agent replies, each agent reply
  tagged with the region that served it and the RTT.
- **"US-East only" toggle (the contrast):** flipping this pins all traffic to a single US region.
  Now distant origins (Jakarta, Santiago) visibly blow past 200ms — the arc turns red, the RTT badge
  goes red, and a callout explains "This is what single-region GPU hosting feels like." Flipping back
  restores sub-40ms.
- **States:** mic-permission-denied (explain + retry), no-capacity-in-region (auto-fails over to next
  nearest, shown as a brief re-home animation), agent-error (inline retry).

## 3. Leaderboard — "Sub-40ms Anywhere"

Fires probes from a dozen simulated global origins and shows every one landing under 40ms.

- **Table/board:** one row per origin city (Nairobi, Jakarta, Santiago, São Paulo, Sydney, Mumbai,
  Lagos, Tokyo, Frankfurt, San Francisco, …). Columns: origin city, region that answered, measured
  RTT (monospace), a horizontal latency bar (green under 40ms), status.
- **Run control:** a "Run probes" button that fires the whole set; rows animate in as each probe
  returns. A summary header shows "12/12 under 40ms" with the max observed RTT.
- **Companion globe:** small globe showing all twelve arcs lit simultaneously, all green.
- **Contrast mode:** a "Single-region (US-East)" toggle re-runs the same probes routed to one region;
  the board fills with amber/red rows for distant origins, and the summary flips to "3/12 under 40ms."
- **States:** probing (per-row spinners), a probe timeout/failure (row marked red with reason), all-
  complete (summary + a subtle celebratory accent when 12/12 pass).

## 4. Mesh Status

Operational view of the live mesh — reachable from the top-bar status pill.

- **Region list:** every active region with: city/label, health (healthy/degraded/down), current
  capacity, in-region load-balancer status, and a recent-RTT sparkline.
- **Globe:** regions colored by health (cyan healthy, amber degraded, red down).
- **Detail-on-select:** clicking a region opens a panel with its GPU type (fractional A16), recent
  probe history, and last-failover event if any.
- **States:** all-healthy (default), degraded (amber region + banner), region-down (red region, and if
  it was serving traffic, a note showing where sessions failed over to), empty (no regions
  provisioned — "Provision a region to begin" with a docs link).

## 5. Docs / SDK

Developer-facing documentation for the `connect()` SDK.

- **Quickstart:** install snippet, a minimal `connect()` → nearest-region session code sample, and the
  single endpoint developers point at.
- **API reference:** `connect()` options, session lifecycle, failover behavior, how nearest-region
  selection works (latency probes + health).
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
> (global rule), then run `/factory` to build.
