// Ported from the "sala" section, Stólpi Kerfi.dc.html lines 301-513 & 1534-1628.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BlueprintBox, BlueprintButton, DataTable, StatCard, Tag, type Column } from "@stolpi/ui";
import { ACTIVITY_TYPE, SALESPEOPLE, short, weightedDealValue, type Activity, type Contact, type Customer, type Deal } from "@stolpi/shared";
import { PageHeader } from "../layout/PageHeader.js";
import { useList, useSalesPipeline, useSalesPlan, useUpdate } from "../api.js";

const TABS = [
  ["dashboard", "Yfirlit"],
  ["pipeline", "Sölupípa"],
  ["plan", "Áætlun vs raun"],
  ["companies", "Fyrirtæki"],
  ["contacts", "Tengiliðir"],
  ["activities", "Verk"],
] as const;
type Tab = (typeof TABS)[number][0];

function TabStrip({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 2, border: "1px solid var(--color-divider)" }}>
      {TABS.map(([id, label]) => (
        <button
          key={id}
          onClick={() => setTab(id)}
          style={{ padding: "8px 15px", border: 0, background: tab === id ? "var(--color-accent)" : "none", color: tab === id ? "var(--color-bg)" : "var(--color-text)", cursor: "pointer", font: "inherit", fontSize: 13, opacity: tab === id ? 1 : 0.72 }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function OwnerPills({ owner, setOwner }: { owner: string; setOwner: (o: string) => void }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7, alignItems: "center" }}>
      <span style={{ fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", opacity: 0.55 }}>Sölumaður</span>
      {["all", ...SALESPEOPLE].map((o) => {
        const active = owner === o;
        return (
          <button
            key={o}
            onClick={() => setOwner(o)}
            style={{ padding: "5px 11px", border: `1px solid ${active ? "var(--color-accent)" : "var(--color-divider)"}`, background: active ? "var(--color-accent)" : "none", color: active ? "var(--color-bg)" : "var(--color-text)", cursor: "pointer", font: "inherit", fontSize: 12 }}
          >
            {o === "all" ? "Allir" : o}
          </button>
        );
      })}
    </div>
  );
}

export function Sala() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [owner, setOwner] = useState("all");
  const nav = useNavigate();

  return (
    <>
      <PageHeader kicker="Sala" title="Sölukerfi" note="Sölupípa, áætlun og samskipti." primary={{ label: "Nýtt tækifæri", onClick: () => nav("/detail/deals/new") }} />
      <div style={{ padding: "26px 28px 64px", display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 18, alignItems: "center", justifyContent: "space-between" }}>
          <TabStrip tab={tab} setTab={setTab} />
          <OwnerPills owner={owner} setOwner={setOwner} />
        </div>
        {tab === "dashboard" ? <SalaDashboard owner={owner} /> : null}
        {tab === "pipeline" ? <SalaPipeline owner={owner} /> : null}
        {tab === "plan" ? <SalaPlan owner={owner} /> : null}
        {tab === "companies" ? <SalaCompanies owner={owner} /> : null}
        {tab === "contacts" ? <SalaContacts /> : null}
        {tab === "activities" ? <SalaActivities /> : null}
      </div>
    </>
  );
}

function SalaDashboard({ owner }: { owner: string }) {
  const { data: deals = [] } = useList<Deal>("deals");
  const { data: activities = [] } = useList<Activity>("activities");
  const { data: customers = [] } = useList<Customer>("customers");
  const nav = useNavigate();
  const cName = (id: string | null) => customers.find((c) => c.id === id)?.name ?? "—";
  const today = new Date().toISOString().slice(0, 10);

  const scoped = owner === "all" ? deals : deals.filter((d) => d.owner === owner);
  const openDeals = scoped.filter((d) => d.stage !== "unnid" && d.stage !== "tapad");
  const won = scoped.filter((d) => d.stage === "unnid");
  const lost = scoped.filter((d) => d.stage === "tapad");
  const overdueActs = activities.filter((a) => !a.done && a.dueDate && a.dueDate < today);

  const byOwner: Record<string, number> = {};
  openDeals.forEach((d) => { byOwner[d.owner] = (byOwner[d.owner] || 0) + d.valueIsk; });
  const maxOwner = Math.max(1, ...Object.values(byOwner));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(178px, 1fr))", gap: 18 }}>
        <StatCard label="Opið pipeline" value={short(openDeals.reduce((s, d) => s + d.valueIsk, 0))} note={`${openDeals.length} tækifæri`} valueSize={28} />
        <StatCard label="Vegið pipeline" value={short(openDeals.reduce((s, d) => s + weightedDealValue(d.valueIsk, d.stage), 0))} note="eftir líkum á stigi" valueSize={28} />
        <StatCard label="Unnið virði" value={short(won.reduce((s, d) => s + d.valueIsk, 0))} note={`${won.length} unnin tækifæri`} valueSize={28} />
        <StatCard label="Vinningshlutfall" value={`${won.length + lost.length ? Math.round((won.length / (won.length + lost.length)) * 100) : 0}%`} note={`${won.length} unnin / ${lost.length} töpuð`} valueSize={28} />
        <StatCard label="Verk yfir tíma" value={String(overdueActs.length)} note="óafgreidd samskipti" valueSize={28} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 22, alignItems: "start" }}>
        <BlueprintBox style={{ padding: "18px 20px" }}>
          <h2 style={{ fontSize: 19, margin: "0 0 8px" }}>Sölupípa eftir sölumanni</h2>
          {Object.keys(byOwner).sort((a, b) => byOwner[b] - byOwner[a]).map((o) => (
            <div key={o} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderTop: "1px solid var(--color-divider)" }}>
              <span style={{ width: 112, fontSize: 13 }}>{o}</span>
              <span style={{ flex: 1, height: 8, background: "var(--color-neutral-200)" }}>
                <span style={{ display: "block", height: "100%", width: `${Math.round((byOwner[o] / maxOwner) * 100)}%`, background: "var(--color-accent)" }} />
              </span>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: 15 }}>{short(byOwner[o])}</span>
            </div>
          ))}
        </BlueprintBox>
        <BlueprintBox style={{ padding: "18px 20px" }}>
          <h2 style={{ fontSize: 19, margin: "0 0 8px" }}>Verk yfir tíma</h2>
          {overdueActs.map((a) => (
            <button
              key={a.id}
              onClick={() => nav(`/detail/activities/${a.id}`)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "9px 0", border: 0, borderTop: "1px solid var(--color-divider)", background: "none", cursor: "pointer", font: "inherit", textAlign: "left" }}
            >
              <span>
                <span style={{ display: "block", fontSize: 13 }}>{a.subject}</span>
                <span style={{ display: "block", fontSize: 12, opacity: 0.6 }}>{ACTIVITY_TYPE[a.type]} · {cName(a.customerId)}</span>
              </span>
              <Tag tone="bad">{a.dueDate}</Tag>
            </button>
          ))}
          {!overdueActs.length ? <div style={{ padding: "10px 0", fontSize: 13, opacity: 0.6 }}>Ekkert yfir tíma.</div> : null}
        </BlueprintBox>
      </div>
    </div>
  );
}

function SalaPipeline({ owner }: { owner: string }) {
  const { data, isLoading } = useSalesPipeline(owner);
  const nav = useNavigate();
  if (isLoading || !data) return <div style={{ opacity: 0.6 }}>Hleð…</div>;
  return (
    <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 10 }}>
      {data.stageCols.map((c: any) => (
        <div key={c.stage} style={{ width: 234, flex: "none", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderBottom: "1px solid var(--color-text)", paddingBottom: 6 }}>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 16, letterSpacing: ".04em", textTransform: "uppercase" }}>{c.label}</span>
            <span style={{ fontSize: 11, opacity: 0.55 }}>{c.prob}%</span>
          </div>
          {c.deals.map((d: any) => (
            <BlueprintButton key={d.id} onClick={() => nav(`/detail/deals/${d.id}`)} style={{ padding: "12px 13px", display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 14, lineHeight: 1.25 }}>{d.title}</span>
              <span style={{ fontSize: 12, opacity: 0.6 }}>{d.customer}</span>
              <span style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: 16, color: "var(--color-accent-800)" }}>{d.value}</span>
                {d.weighted ? <span style={{ fontSize: 11, opacity: 0.55 }}>≈ {d.weighted}</span> : null}
              </span>
            </BlueprintButton>
          ))}
          <div style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", opacity: 0.55 }}>Σ {c.total}</div>
        </div>
      ))}
    </div>
  );
}

function SalaPlan({ owner }: { owner: string }) {
  const { data, isLoading } = useSalesPlan(owner);
  if (isLoading || !data) return <div style={{ opacity: 0.6 }}>Hleð…</div>;
  const scale = Math.max(1, ...data.rows.map((r: any) => Math.max(r.target, r.forecast)));
  const pctColor = (p: number | null) => (p === null ? "var(--color-text)" : p >= 100 ? "#3f6b4d" : p >= 70 ? "#8a6321" : "#8f4038");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(178px, 1fr))", gap: 18 }}>
        <StatCard label={`Áætlun ${new Date().getFullYear()}`} value={data.total.targetLabel} note={owner === "all" ? "allt teymið" : owner} valueSize={28} />
        <StatCard label="Raun (unnið)" value={data.total.wonLabel} note="staðfest á árinu" valueSize={28} />
        <StatCard label="Vegin sölupípa" value={short(data.total.pipe)} note="eftirstöðvar ársins" valueSize={28} />
        <StatCard label="Raun af áætlun" value={`${data.total.pct}%`} note={`spá: ${data.total.forecastLabel}`} valueSize={28} />
      </div>
      <BlueprintBox style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", gap: 18, fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", opacity: 0.65, marginBottom: 14 }}>
          <span>■ Raun</span><span>▨ Vegin sölupípa</span><span>--- Áætlun</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 180 }}>
          {data.rows.map((r: any) => (
            <div key={r.m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
              <div style={{ width: "100%", position: "relative", display: "flex", flexDirection: "column", justifyContent: "flex-end", height: 150 }}>
                {r.target ? <span style={{ position: "absolute", left: 0, right: 0, bottom: Math.round((r.target / scale) * 150), borderTop: "2px dashed var(--color-neutral-600)" }} /> : null}
                <span style={{ display: "block", width: "100%", height: Math.round((r.pipe / scale) * 150), background: "var(--color-accent-300)" }} />
                <span style={{ display: "block", width: "100%", height: Math.round((r.won / scale) * 150), background: "var(--color-accent-800)" }} />
              </div>
              <span style={{ fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", opacity: 0.6 }}>{r.name.slice(0, 3)}</span>
            </div>
          ))}
        </div>
      </BlueprintBox>
      <BlueprintBox style={{ padding: 0, overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ fontFamily: "var(--font-heading)", fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase" }}>Mánuður</th>
              <th style={{ textAlign: "right", fontFamily: "var(--font-heading)", fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase" }}>Áætlun</th>
              <th style={{ textAlign: "right", fontFamily: "var(--font-heading)", fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase" }}>Raun</th>
              <th style={{ textAlign: "right", fontFamily: "var(--font-heading)", fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase" }}>Frávik</th>
              <th style={{ textAlign: "right", fontFamily: "var(--font-heading)", fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase" }}>% af áætlun</th>
              <th style={{ textAlign: "right", fontFamily: "var(--font-heading)", fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase" }}>Spá</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r: any) => (
              <tr key={r.m}>
                <td>{r.name}</td>
                <td style={{ textAlign: "right", opacity: 0.7 }}>{r.target ? short(r.target) : "—"}</td>
                <td style={{ textAlign: "right" }}>{r.won ? short(r.won) : "—"}</td>
                <td style={{ textAlign: "right", color: r.gap >= 0 ? "#3f6b4d" : "#8f4038" }}>{r.target ? `${r.gap >= 0 ? "+" : "−"}${short(Math.abs(r.gap))}` : "—"}</td>
                <td style={{ textAlign: "right", color: pctColor(r.pct), fontFamily: "var(--font-heading)", fontSize: 15 }}>{r.pct === null ? "—" : `${r.pct}%`}</td>
                <td style={{ textAlign: "right", opacity: 0.75 }}>{r.forecast ? short(r.forecast) : "—"}</td>
              </tr>
            ))}
            <tr>
              <td style={{ fontFamily: "var(--font-heading)", fontSize: 15, borderTop: "1px solid var(--color-text)" }}>Samtals</td>
              <td style={{ textAlign: "right", fontFamily: "var(--font-heading)", fontSize: 15, borderTop: "1px solid var(--color-text)" }}>{data.total.targetLabel}</td>
              <td style={{ textAlign: "right", fontFamily: "var(--font-heading)", fontSize: 15, borderTop: "1px solid var(--color-text)" }}>{data.total.wonLabel}</td>
              <td style={{ textAlign: "right", fontFamily: "var(--font-heading)", fontSize: 15, borderTop: "1px solid var(--color-text)" }}>{data.total.gap >= 0 ? "+" : "−"}{short(Math.abs(data.total.gap))}</td>
              <td style={{ textAlign: "right", fontFamily: "var(--font-heading)", fontSize: 15, borderTop: "1px solid var(--color-text)" }}>{data.total.pct}</td>
              <td style={{ textAlign: "right", fontFamily: "var(--font-heading)", fontSize: 15, borderTop: "1px solid var(--color-text)" }}>{data.total.forecastLabel}</td>
            </tr>
          </tbody>
        </table>
      </BlueprintBox>
    </div>
  );
}

function SalaCompanies({ owner }: { owner: string }) {
  const { data: customers = [] } = useList<Customer>("customers");
  const { data: deals = [] } = useList<Deal>("deals");
  const { data: units = [] } = useList<{ id: string; customerId: string | null }>("units");
  const nav = useNavigate();
  const scopedDeals = owner === "all" ? deals : deals.filter((d) => d.owner === owner);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(298px, 1fr))", gap: 22 }}>
      {customers.map((c) => {
        const od = scopedDeals.filter((d) => d.customerId === c.id && d.stage !== "unnid" && d.stage !== "tapad");
        return (
          <BlueprintButton key={c.id} onClick={() => nav(`/detail/customers/${c.id}`)} style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 9 }}>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 21, lineHeight: 1.1 }}>{c.name}</span>
            <span style={{ fontSize: 12, opacity: 0.6 }}>{c.kennitala ?? "—"} · {c.phone ?? "—"}</span>
            <span style={{ display: "flex", gap: 22, paddingTop: 6, borderTop: "1px solid var(--color-divider)" }}>
              <span>
                <span style={{ display: "block", fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", opacity: 0.55 }}>Opin tækifæri</span>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: 19 }}>{od.length}</span>
              </span>
              <span>
                <span style={{ display: "block", fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", opacity: 0.55 }}>Opið virði</span>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: 19, color: "var(--color-accent-800)" }}>{short(od.reduce((s, d) => s + d.valueIsk, 0))}</span>
              </span>
              <span>
                <span style={{ display: "block", fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", opacity: 0.55 }}>Í leigu</span>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: 19 }}>{units.filter((u) => u.customerId === c.id).length}</span>
              </span>
            </span>
          </BlueprintButton>
        );
      })}
    </div>
  );
}

function SalaContacts() {
  const { data: contacts = [] } = useList<Contact>("contacts");
  const { data: customers = [] } = useList<Customer>("customers");
  const { data: activities = [] } = useList<Activity>("activities");
  const nav = useNavigate();
  const cName = (id: string | null) => customers.find((c) => c.id === id)?.name ?? "—";

  const columns: Column<Contact>[] = [
    { header: "Nafn", render: (c) => c.name },
    { header: "Titill", render: (c) => <span style={{ opacity: 0.7 }}>{c.title ?? "—"}</span> },
    { header: "Fyrirtæki", render: (c) => <span style={{ opacity: 0.7 }}>{cName(c.customerId)}</span> },
    { header: "Netfang", render: (c) => <span style={{ opacity: 0.7 }}>{c.email ?? "—"}</span> },
    { header: "Sími", render: (c) => <span style={{ opacity: 0.7 }}>{c.phone ?? "—"}</span> },
    {
      header: "Síðasta samskipti",
      render: (c) => {
        const dates = activities.filter((a) => a.contactId === c.id && a.dueDate).map((a) => a.dueDate!).sort();
        return <span style={{ opacity: 0.7 }}>{dates.length ? dates[dates.length - 1] : "—"}</span>;
      },
    },
    { header: "", align: "right", render: (c) => <button className="btn btn-ghost" onClick={() => nav(`/detail/contacts/${c.id}`)}>Opna</button> },
  ];
  return <DataTable columns={columns} rows={contacts} emptyText="Engir tengiliðir skráðir." />;
}

function SalaActivities() {
  const { data: activities = [] } = useList<Activity>("activities");
  const { data: customers = [] } = useList<Customer>("customers");
  const update = useUpdate<Activity>("activities");
  const nav = useNavigate();
  const cName = (id: string | null) => customers.find((c) => c.id === id)?.name ?? "—";
  const today = new Date().toISOString().slice(0, 10);
  const in7 = new Date(); in7.setDate(in7.getDate() + 7);
  const in7Str = in7.toISOString().slice(0, 10);

  const rows = [...activities].sort((a, b) => (Number(a.done) - Number(b.done)) || ((a.dueDate ?? "9999") < (b.dueDate ?? "9999") ? -1 : 1));

  return (
    <BlueprintBox style={{ padding: 0 }}>
      {rows.map((a) => {
        const overdue = !a.done && a.dueDate && a.dueDate < today;
        const soon = !a.done && a.dueDate && a.dueDate >= today && a.dueDate <= in7Str;
        return (
          <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderBottom: "1px solid var(--color-divider)" }}>
            <button
              onClick={() => update.mutate({ id: a.id, data: { done: !a.done } })}
              style={{ width: 20, height: 20, flex: "none", border: `1px solid ${a.done ? "#3f6b4d" : "var(--color-divider)"}`, background: a.done ? "#dfe9e1" : "transparent", color: "#3f6b4d", cursor: "pointer", font: "inherit", fontSize: 13, lineHeight: "18px", padding: 0 }}
            >
              {a.done ? "✓" : ""}
            </button>
            <button onClick={() => nav(`/detail/activities/${a.id}`)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, border: 0, background: "none", cursor: "pointer", font: "inherit", textAlign: "left" }}>
              <span>
                <span style={{ display: "block", fontSize: 14, textDecoration: a.done ? "line-through" : "none", opacity: a.done ? 0.5 : 1 }}>{a.subject}</span>
                <span style={{ display: "block", fontSize: 12, opacity: 0.6 }}>{ACTIVITY_TYPE[a.type]} · {cName(a.customerId)}</span>
              </span>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: 14, color: overdue ? "#8f4038" : soon ? "#8a6321" : "var(--color-neutral-600)" }}>{a.dueDate ?? "—"}</span>
            </button>
          </div>
        );
      })}
    </BlueprintBox>
  );
}
