import type { Origin, ProbeResult } from "@/lib/mesh";

export type SessionEvent = "tick" | "homed" | "rehome" | "open" | "error" | "close";
type Listener = (probe: ProbeResult | null) => void;

export interface ConnectOptions {
  origin: Origin;
  /** Pin all traffic to a single region (the US-East contrast mode). */
  pinnedRegionId?: string;
}

export interface Session {
  /** The most recent probe tick, or null before the first arrives. */
  current(): ProbeResult | null;
  /** Subscribe to a session event; returns an unsubscribe fn. */
  on(event: SessionEvent, cb: Listener): () => void;
  /** Change origin and/or pin — triggers a re-home. Pass pinnedRegionId undefined to unpin. */
  update(opts: { origin?: Origin; pinnedRegionId?: string }): void;
  close(): void;
}

/**
 * The reference `@proxima/connect` session. Opens an SSE stream to the probe backend and
 * emits live RTT ticks; changing origin or pin re-homes the session (reopens the stream).
 * A `rehome` fires whenever the answering region changes between ticks.
 */
class ProximaSession implements Session {
  private es: EventSource | null = null;
  private listeners = new Map<SessionEvent, Set<Listener>>();
  private last: ProbeResult | null = null;
  private origin: Origin;
  private pin?: string;

  constructor(opts: ConnectOptions) {
    this.origin = opts.origin;
    this.pin = opts.pinnedRegionId;
    this.open();
  }

  private emit(event: SessionEvent, probe: ProbeResult | null) {
    this.listeners.get(event)?.forEach((cb) => cb(probe));
  }

  private open() {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams({
      lat: String(this.origin.lat),
      lon: String(this.origin.lon),
      label: this.origin.label,
    });
    if (this.pin) q.set("pin", this.pin);

    const es = new EventSource(`/api/session?${q.toString()}`);
    this.es = es;
    es.onopen = () => this.emit("open", this.last);
    es.onerror = () => this.emit("error", this.last);
    es.onmessage = (e) => {
      const tick = JSON.parse(e.data) as ProbeResult;
      const prevRegion = this.last?.region.id;
      this.last = tick;
      this.emit("tick", tick);
      if (prevRegion === undefined) this.emit("homed", tick);
      else if (prevRegion !== tick.region.id) this.emit("rehome", tick);
    };
  }

  private reopen() {
    this.es?.close();
    this.open(); // keep `last` so a region change on the next tick fires `rehome`
  }

  current() {
    return this.last;
  }

  on(event: SessionEvent, cb: Listener) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(cb);
    return () => {
      this.listeners.get(event)?.delete(cb);
    };
  }

  update({ origin, pinnedRegionId }: { origin?: Origin; pinnedRegionId?: string }) {
    if (origin) this.origin = origin;
    this.pin = pinnedRegionId;
    this.reopen();
  }

  close() {
    this.es?.close();
    this.es = null;
    this.emit("close", this.last);
  }
}

export function connect(opts: ConnectOptions): Session {
  return new ProximaSession(opts);
}
