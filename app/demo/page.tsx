import { Shell } from "@/components/shell/Shell";
import { StubView } from "@/components/shell/StubView";

export default function DemoPage() {
  return (
    <Shell fill>
      <StubView
        eyebrow="VOICE-AGENT DEMO"
        title="The live demo is landing soon"
        blurb="The reference real-time voice agent — globe re-homing, push-to-talk, and the US-East contrast toggle — ships in the next build."
      />
    </Shell>
  );
}
