// Ported from the "reikningagerð" section, Stólpi Kerfi.dc.html lines 670-747.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Btn, BlueprintBox, DataTable, Select, StatCard, Tag, type Column } from "@stolpi/ui";
import { INVOICE_STATUS, MONTHS, short, type Invoice } from "@stolpi/shared";
import { PageHeader } from "../layout/PageHeader.js";
import { request, useList } from "../api.js";

const BC_MAPPING = [
  { from: "Viðskiptavinur + kennitala", to: "Customer No." },
  { from: "Reikningsnúmer", to: "Document No." },
  { from: "Leiga á einingum + tímabil", to: "Line Description" },
  { from: "Fjöldi eininga / mánaðarverð", to: "Quantity / Unit Price" },
  { from: "Samningsnúmer", to: "Shortcut Dimension 1" },
];

function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function Billing() {
  const [period, setPeriod] = useState(currentPeriod());
  const { data: allInvoices = [], isLoading } = useList<Invoice>("invoices");
  const { data: customers = [] } = useList<{ id: string; name: string }>("customers");
  const qc = useQueryClient();
  const nav = useNavigate();
  const cName = (id: string | null) => customers.find((c) => c.id === id)?.name ?? "—";

  const monthOpts = [];
  for (let i = 0; i < 4; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthOpts.push({ value: v, label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}` });
  }
  monthOpts.push({ value: "Fyrri mánuður", label: "Fyrri keyrsla (söguleg)" });

  const invoices = allInvoices.filter((i) => i.period === period);
  const unsent = invoices.filter((i) => i.status !== "sendur" && i.status !== "greiddur");

  const runBilling = async () => {
    try {
      await request("/billing/run", { method: "POST", body: JSON.stringify({ period }) });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const exportBC = async () => {
    try {
      const res = await fetch("/api/billing/export-bc", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ period }) });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body.error === "string" ? body.error : "Ekki tókst að flytja út.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `BC-leiga-${period}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      qc.invalidateQueries({ queryKey: ["invoices"] });
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const columns: Column<Invoice>[] = [
    { header: "Reikningur", render: (i) => <span style={{ fontFamily: "var(--font-heading)", fontSize: 15 }}>{i.number}</span> },
    { header: "Viðskiptavinur", render: (i) => cName(i.customerId) },
    { header: "Samningur", render: (i) => <span style={{ opacity: 0.75 }}>{i.contractNumber ?? "—"}</span> },
    { header: "Tímabil", render: (i) => <span style={{ opacity: 0.75 }}>{i.period}</span> },
    { header: "Upphæð", align: "right", render: (i) => <span style={{ fontFamily: "var(--font-heading)", fontSize: 15 }}>{short(i.amountIsk)}</span> },
    { header: "BC-tilvísun", render: (i) => <span style={{ opacity: 0.7 }}>{i.bcRef ?? "—"}</span> },
    { header: "Staða", render: (i) => <Tag tone={INVOICE_STATUS[i.status].tone}>{INVOICE_STATUS[i.status].label}</Tag> },
    { header: "", align: "right", render: (i) => <button className="btn btn-ghost" onClick={() => nav(`/detail/invoices/${i.id}`)}>Opna</button> },
  ];

  return (
    <>
      <PageHeader kicker="Sala" title="Reikningagerð" note="Mánaðarlegar leigulínur úr samningum, tilbúnar til útflutnings í Business Central." />
      <div style={{ padding: "26px 28px 64px", display: "flex", flexDirection: "column", gap: 22 }}>
        <BlueprintBox style={{ padding: "16px 18px", display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-end", justifyContent: "space-between" }}>
          <div className="field" style={{ minWidth: 210, margin: 0 }}>
            <label>Reikningstímabil</label>
            <Select value={period} options={monthOpts} onChange={(e) => setPeriod(e.target.value)} placeholder="" />
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Btn variant="secondary" onClick={runBilling}>Keyra leigulínur tímabilsins</Btn>
            <Btn variant="primary" blueprint onClick={exportBC}>Flytja út í Business Central</Btn>
          </div>
        </BlueprintBox>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(186px, 1fr))", gap: 18 }}>
          <StatCard label="Leigulínur tímabils" value={String(invoices.length)} note="úr virkum samningum" valueSize={28} />
          <StatCard label="Til reikningsfærslu" value={short(unsent.reduce((s, i) => s + i.amountIsk, 0))} note="ósent í BC" valueSize={28} />
          <StatCard label="Sent í BC" value={String(allInvoices.filter((i) => i.status === "sendur" || i.status === "greiddur").length)} note="reikningar alls" valueSize={28} />
          <StatCard label="Heildarupphæð tímabils" value={short(invoices.reduce((s, i) => s + i.amountIsk, 0))} note="án vsk" valueSize={28} />
        </div>

        {isLoading ? (
          <div style={{ opacity: 0.6 }}>Hleð…</div>
        ) : (
          <DataTable columns={columns} rows={invoices} emptyText='Engar leigulínur á þessu tímabili. Smelltu á „Keyra leigulínur tímabilsins" til að búa þær til úr virkum samningum.' />
        )}

        <BlueprintBox style={{ padding: "18px 20px" }}>
          <h2 style={{ fontSize: 19, margin: "0 0 4px" }}>Útflutningur í Business Central</h2>
          <div style={{ fontSize: 12.5, opacity: 0.65, marginBottom: 10 }}>Skráin er CSV með einni línu á hvern reikning, tilbúin fyrir Sales Invoice-innlestur í BC.</div>
          {BC_MAPPING.map((m) => (
            <div key={m.from} style={{ display: "flex", justifyContent: "space-between", gap: 14, padding: "8px 0", borderTop: "1px solid var(--color-divider)", fontSize: 13 }}>
              <span style={{ opacity: 0.7 }}>{m.from}</span>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: 15 }}>→ {m.to}</span>
            </div>
          ))}
        </BlueprintBox>
      </div>
    </>
  );
}
