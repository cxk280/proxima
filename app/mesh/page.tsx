import { Shell } from "@/components/shell/Shell";
import { StubView } from "@/components/shell/StubView";

export default function MeshPage() {
  return (
    <Shell fill>
      <StubView
        eyebrow="MESH STATUS"
        title="Mesh Status is landing soon"
        blurb="Live health of every provisioned region — capacity, load balancers, RTT sparklines, and failover events. Ships in a later build."
      />
    </Shell>
  );
}
