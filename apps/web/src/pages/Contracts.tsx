import { useNavigate } from "react-router-dom";
import { StatCard, DataTable, Tag, Btn, type Column } from "@stolpi/ui";
import { CONTRACT_STATUS, short, type Contract, type Unit } from "@stolpi/shared";
import { PageHeader } from "../layout/PageHeader.js";
import { useList } from "../api.js";

export function Contracts() {
  const { data: contracts = [], isLoading } = useList<Contract>("contracts");
  const { data: customers = [] } = useList<{ id: string; name: string }>("customers");
  const { data: projects = [] } = useList<{ id: string; name: string }>("projects");
  const { data: units = [] } = useList<Unit>("units");
  const nav = useNavigate();
  const today = new Date().toISOString().slice(0, 10);
  const in60 = new Date();
  in60.setDate(in60.getDate() + 60);
  const in60Str = in60.toISOString().slice(0, 10);

  const cName = (id: string | null) => customers.find((c) => c.id === id)?.name ?? "—";
  const pName = (id: string | null) => projects.find((p) => p.id === id)?.name ?? "—";
  const uCode = (id: string) => units.find((u) => u.id === id)?.code ?? "—";

  const active = contracts.filter((c) => c.status === "virkur");
  const mrr = contracts.filter((c) => c.status === "virkur" || c.status === "rennur_ut").reduce((s, c) => s + c.monthlyIsk, 0);
  const soon = contracts.filter((c) => c.endDate && c.endDate <= in60Str && c.status !== "lokid").length;
  const drafts = contracts.filter((c) => c.status === "drog").length;

  const columns: Column<Contract>[] = [
    { header: "Samningur", render: (c) => <span style={{ fontFamily: "var(--font-heading)", fontSize: 15 }}>{c.number}</span> },
    { header: "Viðskiptavinur", render: (c) => cName(c.customerId) },
    { header: "Verkefni", render: (c) => <span style={{ opacity: 0.75 }}>{pName(c.projectId)}</span> },
    { header: "Einingar", render: (c) => <span style={{ opacity: 0.75 }}>{(c.unitIds || []).map(uCode).join(", ") || "—"}</span> },
    { header: "Tímabil", render: (c) => <span style={{ fontSize: 12, opacity: 0.7 }}>{c.startDate ?? "—"} → {c.endDate ?? "—"}</span> },
    { header: "Mánaðarverð", align: "right", render: (c) => <span style={{ fontFamily: "var(--font-heading)", fontSize: 15 }}>{short(c.monthlyIsk)}</span> },
    { header: "Staða", render: (c) => <Tag tone={CONTRACT_STATUS[c.status].tone}>{CONTRACT_STATUS[c.status].label}</Tag> },
    { header: "", align: "right", render: (c) => <Btn variant="ghost" onClick={() => nav(`/detail/contracts/${c.id}`)}>Opna</Btn> },
  ];

  return (
    <>
      <PageHeader kicker="Sala" title="Leigusamningar" note="Virkir samningar, gildistími og mánaðarverð." primary={{ label: "Nýr samningur", onClick: () => nav("/detail/contracts/new") }} />
      <div style={{ padding: "26px 28px 64px", display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(186px, 1fr))", gap: 18 }}>
          <StatCard label="Virkir samningar" value={String(active.length)} note={`${contracts.length} skráðir alls`} valueSize={28} />
          <StatCard label="Leigutekjur / mán." value={short(mrr)} note="virkir og útrennandi" valueSize={28} />
          <StatCard label="Renna út innan 60 daga" value={String(soon)} note="þarf framlengingu eða skil" valueSize={28} />
          <StatCard label="Drög" value={String(drafts)} note="bíða undirritunar" valueSize={28} />
        </div>
        {isLoading ? <div style={{ opacity: 0.6 }}>Hleð…</div> : <DataTable columns={columns} rows={contracts} emptyText="Engir samningar skráðir." />}
      </div>
    </>
  );
}
