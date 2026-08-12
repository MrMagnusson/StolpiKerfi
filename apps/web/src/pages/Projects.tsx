import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable, Tag, Btn, type Column } from "@stolpi/ui";
import { PROJ_STATUS, buildMatch, norm, type Project, type Unit } from "@stolpi/shared";
import { PageHeader } from "../layout/PageHeader.js";
import { useList } from "../api.js";

export function Projects() {
  const { data: projects = [], isLoading } = useList<Project>("projects");
  const { data: units = [] } = useList<Unit>("units");
  const { data: customers = [] } = useList<{ id: string; name: string }>("customers");
  const [q, setQ] = useState("");
  const nav = useNavigate();

  const cName = (id: string | null) => customers.find((c) => c.id === id)?.name ?? "—";

  const rows = projects.filter((p) => !q || norm(`${p.name} ${p.location ?? ""}`).includes(norm(q)));

  const columns: Column<Project>[] = [
    {
      header: "Verkefni",
      render: (p) => (
        <>
          <span style={{ fontSize: 14 }}>{p.name}</span>
          <br />
          <span style={{ fontSize: 12, opacity: 0.55 }}>{p.location ?? "—"}</span>
        </>
      ),
    },
    { header: "Viðskiptavinur", render: (p) => <span style={{ opacity: 0.8 }}>{cName(p.customerId)}</span> },
    {
      header: "Tímabil",
      render: (p) => <span style={{ fontSize: 12, opacity: 0.7 }}>{p.startDate ?? "—"} → {p.endDate ?? "—"}</span>,
    },
    {
      header: "Kröfur",
      render: (p) => {
        const reqs = [p.needsToilet ? "klósett" : null, p.minSizeM2 ? `≥${p.minSizeM2} m²` : null, ...(p.requiredEquipment || [])].filter(Boolean);
        return <span style={{ fontSize: 12, opacity: 0.8 }}>{reqs.length ? reqs.join(", ") : "—"}</span>;
      },
    },
    {
      header: "Þörf",
      render: (p) => {
        const m = buildMatch(p, units);
        const ok = m.eligible.length >= (p.unitsNeeded || 0);
        return (
          <span style={{ fontFamily: "var(--font-heading)", fontSize: 14 }}>
            <Tag tone={ok ? "ok" : "warn"}>{m.eligible.length} / {p.unitsNeeded || 0}</Tag>
          </span>
        );
      },
    },
    { header: "Staða", render: (p) => <Tag tone={p.status === "active" ? "info" : "neutral"}>{PROJ_STATUS[p.status]}</Tag> },
    {
      header: "",
      align: "right",
      render: (p) => (
        <>
          <Btn variant="ghost" onClick={() => nav(`/porun?project=${p.id}`)}>Para</Btn>
          <Btn variant="ghost" onClick={() => nav(`/detail/projects/${p.id}`)}>Opna</Btn>
        </>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        kicker="Rekstur"
        title="Verkefni"
        note="Kröfur hvers verkefnis og hvort flotinn annar þeim."
        search={{ value: q, onChange: setQ }}
        primary={{ label: "Nýtt verkefni", onClick: () => nav("/detail/projects/new") }}
      />
      <div style={{ padding: "26px 28px 64px" }}>
        {isLoading ? <div style={{ opacity: 0.6 }}>Hleð…</div> : <DataTable columns={columns} rows={rows} emptyText="Engin verkefni fundust." />}
      </div>
    </>
  );
}
