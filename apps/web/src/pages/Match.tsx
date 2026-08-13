// Ported from the "pörun" section, Stólpi Kerfi.dc.html lines 232-299 & 1503-1532.
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Btn, BlueprintBox, Select } from "@stolpi/ui";
import { TONES, type Project } from "@stolpi/shared";
import { PageHeader } from "../layout/PageHeader.js";
import { useList, useMatch, request } from "../api.js";

export function Match() {
  const [params, setParams] = useSearchParams();
  const { data: projects = [] } = useList<Project>("projects");
  const { data: customers = [] } = useList<{ id: string; name: string }>("customers");
  const cName = (id: string | null) => customers.find((c) => c.id === id)?.name ?? "—";

  const selected = params.get("project") || projects[0]?.id || "";
  useEffect(() => {
    if (!params.get("project") && projects[0]) setParams({ project: projects[0].id }, { replace: true });
  }, [projects]); // eslint-disable-line react-hooks/exhaustive-deps

  const project = projects.find((p) => p.id === selected);
  const { data: match, isLoading } = useMatch(selected || undefined);
  const qc = useQueryClient();

  const reserve = async (unitId: string) => {
    await request(`/match/${selected}/reserve/${unitId}`, { method: "POST" });
    qc.invalidateQueries({ queryKey: ["match", selected] });
    qc.invalidateQueries({ queryKey: ["units"] });
  };

  const need = project?.unitsNeeded || match?.eligible.length || 0;
  const recommended = match ? match.eligible.slice(0, need) : [];
  const others = match ? match.eligible.slice(need).concat(match.notEligible) : [];
  const shortfall = match ? Math.max(0, need - match.eligible.length) : 0;
  const alertTone = shortfall > 0 ? TONES.warn : TONES.ok;

  return (
    <>
      <PageHeader kicker="Sjálfvirk tillaga" title="Pörun eininga" note="Kerfið raðar lausum einingum eftir því hversu vel þær uppfylla kröfur verkefnisins." />
      <div style={{ padding: "26px 28px 64px", display: "flex", flexDirection: "column", gap: 22 }}>
        <BlueprintBox style={{ padding: "18px 20px", display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-end" }}>
          <div className="field" style={{ minWidth: 250 }}>
            <label>Verkefni</label>
            <Select
              value={selected}
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
              onChange={(e) => setParams({ project: e.target.value })}
            />
          </div>
          {project ? (
            [
              { label: "Viðskiptavinur", value: cName(project.customerId) },
              { label: "Fjöldi eininga", value: String(project.unitsNeeded || 0) },
              { label: "Lágmarksstærð", value: project.minSizeM2 ? `${project.minSizeM2} m²` : "—" },
              { label: "Klósett", value: project.needsToilet ? "Krafa" : "Ekki krafa" },
              { label: "Staðsetning", value: project.location || "—" },
            ].map((f) => (
              <div key={f.label}>
                <div style={{ fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", opacity: 0.55 }}>{f.label}</div>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: 20, lineHeight: 1.2 }}>{f.value}</div>
              </div>
            ))
          ) : null}
        </BlueprintBox>

        {project && match ? (
          <div style={{ background: alertTone.bg, color: alertTone.fg, padding: "12px 16px", fontSize: 14, borderLeft: `3px solid ${alertTone.fg}` }}>
            {shortfall > 0
              ? `${match.eligible.length} af ${need} einingum uppfylla kröfur — það vantar ${shortfall}. Skoðaðu einingar sem eru á leið til baka eða beiðnir í vinnslu.`
              : `${match.eligible.length} einingar uppfylla allar kröfur verkefnisins (þörf: ${need}).`}
          </div>
        ) : null}

        {isLoading ? (
          <div style={{ opacity: 0.6 }}>Hleð…</div>
        ) : (
          <>
            <div>
              <h2 style={{ fontSize: 20, margin: "0 0 12px" }}>Ráðlagðar einingar</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 22 }}>
                {recommended.map((m: any) => {
                  const barTone = m.percent >= 80 ? TONES.ok : m.percent >= 55 ? TONES.warn : TONES.bad;
                  return (
                    <BlueprintBox key={m.unit.id} style={{ padding: "15px 17px", display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: "var(--font-heading)", fontSize: 21, letterSpacing: ".03em" }}>{m.unit.code}</span>
                        <span style={{ fontSize: 12, opacity: 0.65 }}>{m.unit.sizeM2} m² · {m.unit.location}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ flex: 1, height: 8, background: "var(--color-neutral-200)" }}>
                          <span style={{ display: "block", height: "100%", width: `${m.percent}%`, background: barTone.fg }} />
                        </span>
                        <span style={{ fontFamily: "var(--font-heading)", fontSize: 17 }}>{m.percent}%</span>
                      </div>
                      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
                        {m.reasons.map((r: any, i: number) => (
                          <li key={i} style={{ fontSize: 12.5, color: r.ok ? TONES.ok.fg : TONES.warn.fg }}>
                            {r.ok ? "✓ " : "✕ "}
                            {r.text}
                          </li>
                        ))}
                      </ul>
                      <Btn variant="secondary" onClick={() => reserve(m.unit.id)} style={{ alignSelf: "flex-start" }}>
                        {m.unit.status === "available" ? "Taka frá fyrir verkefnið" : "Skoða einingu"}
                      </Btn>
                    </BlueprintBox>
                  );
                })}
                {!recommended.length ? <div style={{ opacity: 0.6, fontSize: 13 }}>Engin eining mælir með sér fyrir þetta verkefni.</div> : null}
              </div>
            </div>

            <details>
              <summary style={{ cursor: "pointer", fontFamily: "var(--font-heading)", fontSize: 17, letterSpacing: ".02em" }}>Aðrar mögulegar og útilokaðar einingar</summary>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 18, marginTop: 14 }}>
                {others.map((m: any) => (
                  <div key={m.unit.id} style={{ border: "1px dashed var(--color-divider)", padding: "13px 15px", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: "var(--font-heading)", fontSize: 19, letterSpacing: ".03em" }}>{m.unit.code}</span>
                      <span style={{ fontSize: 12, opacity: 0.6 }}>{m.unit.sizeM2} m² · {m.unit.location}</span>
                    </div>
                    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 3 }}>
                      {m.reasons.map((r: any, i: number) => (
                        <li key={i} style={{ fontSize: 12.5, color: r.ok ? TONES.ok.fg : TONES.warn.fg }}>
                          {r.ok ? "✓ " : "✕ "}
                          {r.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </details>
          </>
        )}
      </div>
    </>
  );
}
