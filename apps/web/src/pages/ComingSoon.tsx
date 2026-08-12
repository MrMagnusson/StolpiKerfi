import { PageHeader } from "../layout/PageHeader.js";
import { EmptyState } from "@stolpi/ui";

/** Placeholder for pages scheduled in Áfangi C/D — keeps the full nav visible per the design while those screens are built. */
export function ComingSoon({ title }: { title: string }) {
  return (
    <>
      <PageHeader kicker="Kemur síðar" title={title} note="Þessi síða er á dagskrá í næsta áfanga innleiðingar." />
      <div style={{ padding: "26px 28px 64px" }}>
        <EmptyState text={`${title} er ekki komið í þessa útgáfu enn.`} />
      </div>
    </>
  );
}
