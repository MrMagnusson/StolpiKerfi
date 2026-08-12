import { useNavigate } from "react-router-dom";
import { StatCard, Tag, BlueprintBox } from "@stolpi/ui";
import { TONES, type Tone } from "@stolpi/shared";
import { PageHeader } from "../layout/PageHeader.js";
import { useDashboard } from "../api.js";

export function Dashboard() {
  const { data, isLoading } = useDashboard();
  const nav = useNavigate();

  return (
    <>
      <PageHeader kicker="Rekstur · Í dag" title="Yfirlit" note="Það sem þarf ákvörðun í dag — flotinn, beiðnir og sölupípan á einum skjá." />
      <div style={{ padding: "26px 28px 64px", display: "flex", flexDirection: "column", gap: 26 }}>
        {isLoading || !data ? (
          <div style={{ opacity: 0.6 }}>Hleð…</div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(186px, 1fr))", gap: 18 }}>
              {data.dashStats.map((s: any) => (
                <StatCard key={s.label} label={s.label} value={s.value} note={s.note} />
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))", gap: 22, alignItems: "start" }}>
              <BlueprintBox style={{ padding: "18px 20px", gridColumn: "span 2", minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6, gap: 12 }}>
                  <h2 style={{ fontSize: 19, margin: 0 }}>Þarf athygli í dag</h2>
                  <span style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", opacity: 0.55 }}>Raðað eftir vanskilum</span>
                </div>
                {data.attention.map((a: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => nav(`/detail/${a.kind}/${a.id}`)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "11px 2px", border: 0, borderTop: "1px solid var(--color-divider)", background: "none", cursor: "pointer", textAlign: "left", font: "inherit" }}
                  >
                    <span style={{ width: 9, height: 9, flex: "none", background: TONES[a.tone as Tone].fg }} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 14 }}>{a.title}</span>
                      <span style={{ display: "block", fontSize: 12, opacity: 0.6 }}>{a.meta}</span>
                    </span>
                    <Tag tone={a.tone as Tone}>{a.tag}</Tag>
                  </button>
                ))}
                {data.attention.length === 0 ? <div style={{ padding: "16px 2px", fontSize: 13, opacity: 0.6 }}>Ekkert krefst athygli í dag.</div> : null}
              </BlueprintBox>

              <BlueprintBox style={{ padding: "18px 20px", minWidth: 0 }}>
                <h2 style={{ fontSize: 19, margin: "0 0 10px" }}>Staða flotans</h2>
                {data.fleetRows.map((f: any) => (
                  <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
                    <span style={{ width: 10, height: 10, flex: "none", background: TONES[f.tone as Tone].fg }} />
                    <span style={{ width: 112, fontSize: 13 }}>{f.label}</span>
                    <span style={{ flex: 1, height: 8, background: "var(--color-neutral-200)" }}>
                      <span style={{ display: "block", height: "100%", width: `${f.percent}%`, background: TONES[f.tone as Tone].fg }} />
                    </span>
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: 15, width: 22, textAlign: "right" }}>{f.count}</span>
                  </div>
                ))}
              </BlueprintBox>

              <BlueprintBox style={{ padding: "18px 20px", minWidth: 0 }}>
                <h2 style={{ fontSize: 19, margin: "0 0 6px" }}>Sölupípa eftir stigum</h2>
                {data.stageRows.map((s: any) => (
                  <div key={s.label} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, padding: "7px 0", borderTop: "1px solid var(--color-divider)" }}>
                    <span style={{ fontSize: 13 }}>
                      {s.label}
                      <span style={{ opacity: 0.5 }}> · {s.count}</span>
                    </span>
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: 15, color: "var(--color-accent-700)" }}>{s.value}</span>
                  </div>
                ))}
              </BlueprintBox>

              <BlueprintBox style={{ padding: "18px 20px", minWidth: 0 }}>
                <h2 style={{ fontSize: 19, margin: "0 0 6px" }}>Samningar á næstunni</h2>
                {data.contractSoon.map((c: any) => (
                  <button
                    key={c.id}
                    onClick={() => nav(`/detail/contracts/${c.id}`)}
                    style={{ width: "100%", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, padding: "9px 0", border: 0, borderTop: "1px solid var(--color-divider)", background: "none", cursor: "pointer", font: "inherit", textAlign: "left" }}
                  >
                    <span>
                      <span style={{ display: "block", fontSize: 13 }}>{c.number} · {c.customer}</span>
                      <span style={{ display: "block", fontSize: 12, opacity: 0.6 }}>{c.period}</span>
                    </span>
                    <Tag tone={c.tone as Tone}>{c.status}</Tag>
                  </button>
                ))}
              </BlueprintBox>
            </div>
          </>
        )}
      </div>
    </>
  );
}
