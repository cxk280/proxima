import { Shell } from "@/components/shell/Shell";
import { StubView } from "@/components/shell/StubView";

export default function DocsPage() {
  return (
    <Shell fill>
      <StubView
        eyebrow="DOCS / SDK"
        title="The docs are landing soon"
        blurb="Quickstart, the connect() SDK reference, failover behaviour, and nearest-region selection. Ships in a later build."
      />
    </Shell>
  );
}
