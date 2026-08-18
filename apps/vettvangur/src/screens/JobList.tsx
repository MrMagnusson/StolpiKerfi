// Ported from Screen A "Verk dagsins", Stólpi Vettvangur.dc.html lines 22-61 & 329-352.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { REQ_TYPE, TONES, intakeStepsFor, isIntakeReqType, type Tone } from "@stolpi/shared";
import { useRequests, type VettvangurRequest } from "../api.js";
import { loadProgress, unitState } from "../progress.js";

type FilterId = "today" | "all" | "done";
const FILTERS: [FilterId, string][] = [
  ["today", "Í dag"],
  ["all", "Allar opnar"],
  ["done", "Lokið"],
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function JobList() {
  const { data: requests = [], isLoading } = useRequests();
  const [filter, setFilter] = useState<FilterId>("today");
  const nav = useNavigate();
  const today = todayIso();

  const open = requests.filter((r) => r.status === "ny" || r.status === "i_vinnslu");
  const sets: Record<FilterId, VettvangurRequest[]> = {
    today: open.filter((r) => !r.dueDate || r.dueDate <= today),
    all: open,
    done: requests.filter((r) => r.status === "lokid" || r.status === "tilbuin"),
  };
  const list = sets[filter];

  return (
    <section style={{ display: "flex", flexDirection: "column", minHeight: 844 }}>
      <header style={{ padding: "20px 18px 14px", borderBottom: "1px solid var(--color-divider)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>Stólpi · Vettvangur</div>
          <h1 style={{ fontSize: 27, margin: "3px 0 0", lineHeight: 1 }}>Verk dagsins</h1>
        </div>
        <div className="blueprint" style={{ width: 38, height: 38, flex: "none", display: "grid", placeItems: "center", fontFamily: "var(--font-heading)", fontSize: 14 }}>
          SV
        </div>
      </header>

      <div style={{ display: "flex", gap: 8, padding: "14px 18px 4px", overflowX: "auto" }}>
        {FILTERS.map(([id, label]) => {
          const active = filter === id;
          return (
            <button
              key={id}
              onClick={() => setFilter(id)}
              style={{ padding: "9px 14px", minHeight: 44, border: `1px solid ${active ? "var(--color-accent)" : "var(--color-divider)"}`, background: active ? "var(--color-accent)" : "none", color: active ? "var(--color-bg)" : "var(--color-text)", cursor: "pointer", font: "inherit", fontSize: 14, whiteSpace: "nowrap" }}
            >
              {label} <span style={{ opacity: 0.65 }}>{sets[id].length}</span>
            </button>
          );
        })}
      </div>

      <div style={{ padding: "10px 18px 0" }}>
        <button className="btn btn-secondary" onClick={() => nav("/nytt")} style={{ width: "100%", minHeight: 46, fontSize: 14 }}>
          + Nýtt verk
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "14px 18px 30px" }}>
        {isLoading ? <div style={{ opacity: 0.6, padding: "16px 0" }}>Hleð…</div> : null}
        {!isLoading && list.length === 0 ? (
          <div style={{ border: "1px dashed var(--color-divider)", padding: "28px 16px", textAlign: "center", fontSize: 14, opacity: 0.6 }}>Engin verk í þessum flokki.</div>
        ) : null}
        {list.map((r) => {
          const isIntake = isIntakeReqType(r.type);
          const steps = intakeStepsFor(r.type);
          const progress = loadProgress(r.id);
          const singleUnit = r.unitIds.length === 1;
          const doneUnits = r.unitIds.filter((uid) => unitState(progress, uid).done).length;
          const segments = singleUnit ? steps.length : r.unitIds.length;
          const at = r.status === "lokid" ? segments : singleUnit ? unitState(progress, r.unitIds[0]).step : doneUnits;
          const overdue = r.dueDate && r.dueDate < today && r.status !== "lokid";
          const tone: Tone = r.status === "lokid" ? "ok" : overdue ? "bad" : r.priority === "ha" ? "warn" : "info";
          const statusLabel = r.status === "lokid" ? "Lokið" : overdue ? "Yfir tíma" : r.priority === "ha" ? "Forgangur" : "Í vinnslu";
          return (
            <button
              key={r.id}
              className="blueprint"
              onClick={() => nav(`/verk/${r.id}`)}
              style={{ padding: "14px 15px", background: "none", border: 0, cursor: "pointer", textAlign: "left", font: "inherit", display: "flex", flexDirection: "column", gap: 9 }}
            >
              <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: 24, letterSpacing: ".03em", lineHeight: 1 }}>
                  {r.units.length === 1 ? (r.units[0]?.code ?? "—") : `${r.units.length} einingar`}
                </span>
                <span className="tag" style={{ background: TONES[tone].bg, color: TONES[tone].fg }}>{statusLabel}</span>
              </span>
              <span style={{ fontSize: 15, lineHeight: 1.3 }}>{r.title}</span>
              <span style={{ fontSize: 13, opacity: 0.65 }}>
                {REQ_TYPE[r.type as keyof typeof REQ_TYPE]} · {r.units.length === 1 ? `${r.units[0]?.sizeM2 ? `${r.units[0].sizeM2} m² · ` : ""}${r.units[0]?.location ?? ""}` : r.units.map((u) => u.code).join(", ")}
              </span>
              {isIntake ? (
                <>
                  <span style={{ display: "flex", gap: 5, paddingTop: 8, borderTop: "1px solid var(--color-divider)", width: "100%" }}>
                    {Array.from({ length: segments }).map((_, i) => (
                      <span key={i} style={{ flex: 1, height: 6, background: i < at ? "var(--color-accent)" : "var(--color-neutral-300)" }} />
                    ))}
                  </span>
                  <span style={{ fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", opacity: 0.55 }}>
                    {r.status === "lokid" ? "Ferli lokið" : at === 0 ? "Ekki hafið" : singleUnit ? `Skref ${at} af ${segments} lokið` : `${at} af ${segments} eininga lokið`}
                  </span>
                </>
              ) : (
                <span style={{ fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", opacity: 0.55, paddingTop: 8, borderTop: "1px solid var(--color-divider)" }}>
                  {r.status === "lokid" ? "Verki lokið" : "Ólokið"}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
