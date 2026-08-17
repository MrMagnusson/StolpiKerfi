// Ported from the "verðskrá & tilboð" section, Stólpi Kerfi.dc.html lines 562-609.
import { useNavigate } from "react-router-dom";
import { BlueprintBox, BlueprintButton, Tag } from "@stolpi/ui";
import { QUOTE_STATUS, short, type PriceItem, type Quote } from "@stolpi/shared";
import { PageHeader } from "../layout/PageHeader.js";
import { useList } from "../api.js";

export function Pricing() {
  const { data: pricing = [] } = useList<PriceItem>("pricing");
  const { data: quotes = [] } = useList<Quote>("quotes");
  const { data: customers = [] } = useList<{ id: string; name: string }>("customers");
  const { data: projects = [] } = useList<{ id: string; name: string }>("projects");
  const nav = useNavigate();
  const cName = (id: string | null) => customers.find((c) => c.id === id)?.name ?? "—";
  const pName = (id: string | null) => projects.find((p) => p.id === id)?.name ?? "—";
  const year = new Date().getFullYear();

  return (
    <>
      <PageHeader kicker="Sala" title="Verðskrá & tilboð" note="Grunnverð flokka og tilboð í vinnslu." primary={{ label: "Nýtt tilboð", onClick: () => nav("/detail/quotes/new") }} />
      <div style={{ padding: "26px 28px 64px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 24, alignItems: "start" }}>
        <BlueprintBox style={{ padding: 0, minWidth: 0, overflowX: "auto" }}>
          <div style={{ padding: "16px 18px 8px" }}>
            <h2 style={{ fontSize: 20, margin: 0 }}>Verðskrá {year}</h2>
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 3 }}>Grunnverð án afsláttar. Langtímasamningar fá kjör skv. samningi.</div>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Flokkur</th>
                <th style={{ textAlign: "right" }}>Mánaðarleiga</th>
                <th style={{ textAlign: "right" }}>Afhending</th>
                <th style={{ textAlign: "right" }}>Lágm. tími</th>
              </tr>
            </thead>
            <tbody>
              {pricing.map((p) => (
                <tr key={p.id} onClick={() => nav(`/detail/pricing/${p.id}`)} style={{ cursor: "pointer" }}>
                  <td>
                    {p.name}
                    <br />
                    <span style={{ fontSize: 12, opacity: 0.55 }}>{p.note ?? ""}</span>
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-heading)", fontSize: 15 }}>{short(p.monthlyIsk)}</td>
                  <td style={{ textAlign: "right", opacity: 0.75 }}>{short(p.deliveryIsk)}</td>
                  <td style={{ textAlign: "right", opacity: 0.75 }}>{p.minMonths} mán.</td>
                </tr>
              ))}
            </tbody>
          </table>
        </BlueprintBox>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <h2 style={{ fontSize: 20, margin: 0 }}>Tilboð í vinnslu</h2>
          {quotes.map((q) => (
            <BlueprintButton key={q.id} onClick={() => nav(`/detail/quotes/${q.id}`)} style={{ padding: "15px 17px", display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: 19 }}>{q.number} · {cName(q.customerId)}</span>
                <Tag tone={QUOTE_STATUS[q.status].tone}>{QUOTE_STATUS[q.status].label}</Tag>
              </span>
              <span style={{ fontSize: 12.5, opacity: 0.7 }}>{pName(q.projectId)}</span>
              <span style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: 6, borderTop: "1px solid var(--color-divider)" }}>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: 20, color: "var(--color-accent-800)" }}>{short(q.totalIsk)}</span>
                <span style={{ fontSize: 12, opacity: 0.6 }}>Gildir til {q.validTo ?? "—"}</span>
              </span>
            </BlueprintButton>
          ))}
        </div>
      </div>
    </>
  );
}
