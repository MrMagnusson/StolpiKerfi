// Ported from Screen B "Skilyrt ferli" + Screen C "Lokið", Stólpi Vettvangur.dc.html lines 64-180 &
// the requirements()/next() logic at lines 279-320. This is the core requirement of the design —
// the primary button stays disabled until every unmet requirement for the current step is resolved.
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  DAMAGE_CAUSE, INTAKE_CHECKS, INTAKE_STEPS, TONES, type CheckMark,
} from "@stolpi/shared";
import { useRequests, useRequestsInvalidate, completeRequest } from "../api.js";
import { loadProgress, saveProgress, clearProgress, type FlowProgress } from "../progress.js";
import { downscaleAndUpload } from "../photo.js";

const LOCATIONS = ["Lager RVK", "Lager Akureyri", "Verkstæði"];

function now(): string {
  return new Date().toTimeString().slice(0, 5);
}

interface DoneInfo {
  code: string;
  by: string;
  photos: number;
  issues: number;
  cost: number;
}

export function JobFlow() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const { data: requests = [] } = useRequests();
  const invalidate = useRequestsInvalidate();
  const request = requests.find((r) => r.id === id);

  const [progress, setProgress] = useState<FlowProgress>(() => loadProgress(id));
  const [screen, setScreen] = useState<"flow" | "done">("flow");
  const [done, setDone] = useState<DoneInfo | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setProgress(loadProgress(id));
  }, [id]);

  useEffect(() => {
    if (screen === "flow") saveProgress(id, progress);
  }, [id, progress, screen]);

  const step = INTAKE_STEPS[progress.step];
  const stepKey = step?.key;
  const checklist = stepKey ? INTAKE_CHECKS[stepKey] : [];
  const hasIssue = stepKey === "astand" && checklist.some((c) => progress.checks[`astand:${c.key}`] === "issue");

  const photoGroups = useMemo(() => {
    if (!stepKey) return [];
    if (stepKey === "mottaka") return [{ key: "koma", title: "Mynd við komu", hint: "Yfirlitsmynd af einingunni eins og hún kom úr flutningi.", min: 1 }];
    if (stepKey === "astand") {
      return hasIssue
        ? [{ key: "skemmd", title: "Myndir af skemmd", hint: "Nærmynd af hverjum lið sem er merktur með athugasemd.", min: 1 }]
        : [{ key: "yfirlit", title: "Yfirlitsmyndir (valfrjálst)", hint: "Engin athugasemd skráð — myndir eru valfrjálsar á þessu skrefi.", min: 0 }];
    }
    if (stepKey === "standsetning") return [{ key: "standsett", title: "Mynd eftir standsetningu", hint: "Sýnir eininguna þrifna og fullbúna.", min: 1 }];
    if (stepKey === "tilbuin")
      return [
        { key: "astand_inni", title: "Núverandi ástand — að innan", hint: "Ein mynd af rými eftir standsetningu.", min: 1 },
        { key: "astand_uti", title: "Núverandi ástand — að utan", hint: "Ein mynd af klæðningu og merkingu.", min: 1 },
      ];
    return [];
  }, [stepKey, hasIssue]);

  const requirements = useMemo(() => {
    if (!stepKey) return [];
    const need: string[] = [];
    const ph = (g: string) => (progress.photos[g] || []).length;
    const unrated = checklist.filter((c) => !progress.checks[`${stepKey}:${c.key}`]);
    if (unrated.length) need.push(`${unrated.length} liðir eftir í gátlista: ${unrated.map((c) => c.label).join(", ")}`);
    if (stepKey === "mottaka" && ph("koma") < 1) need.push("Mynd af einingu við komu vantar (1 skylda)");
    if (stepKey === "mottaka" && !progress.form.stadsetning) need.push("Staðsetning á lager ekki valin");
    if (stepKey === "astand" && hasIssue) {
      if (ph("skemmd") < 1) need.push(`Mynd af skemmd vantar — ${checklist.filter((c) => progress.checks[`astand:${c.key}`] === "issue").length} liðir merktir með athugasemd`);
      if (!progress.form.orsok) need.push("Velja þarf hver olli skemmdinni");
      if (!progress.form.abyrgd) need.push("Skrá þarf nafn ábyrgðaraðila");
    }
    if (stepKey === "standsetning" && ph("standsett") < 1) need.push("Mynd eftir standsetningu vantar (1 skylda)");
    if (stepKey === "tilbuin" && ph("astand_inni") < 1) need.push("Ástandsmynd að innan vantar");
    if (stepKey === "tilbuin" && ph("astand_uti") < 1) need.push("Ástandsmynd að utan vantar");
    if (stepKey === "tilbuin" && !progress.form.stadfest_af) need.push("Nafn þess sem staðfestir vantar");
    return need;
  }, [stepKey, checklist, progress, hasIssue]);

  if (!request) {
    return <div style={{ padding: 28, opacity: 0.6 }}>Hleð…</div>;
  }

  const toggleCheck = (key: string) => {
    setProgress((p) => {
      const id2 = `${stepKey}:${key}`;
      const cur = p.checks[id2];
      const next: CheckMark = cur === "ok" ? "issue" : cur === "issue" ? null : "ok";
      return { ...p, checks: { ...p.checks, [id2]: next } };
    });
  };
  const setField = (key: string, value: string) => setProgress((p) => ({ ...p, form: { ...p.form, [key]: value } }));

  const addPhoto = async (group: string, file: File) => {
    try {
      const url = await downscaleAndUpload(file);
      setProgress((p) => ({ ...p, photos: { ...p.photos, [group]: [...(p.photos[group] || []), url] } }));
    } catch (e) {
      alert("Ekki tókst að hlaða upp mynd: " + (e as Error).message);
    }
  };
  const removePhoto = (group: string, i: number) =>
    setProgress((p) => ({ ...p, photos: { ...p.photos, [group]: (p.photos[group] || []).filter((_, j) => j !== i) } }));

  const next = async () => {
    if (requirements.length || busy) return;
    if (progress.step < 3) {
      setProgress((p) => ({ ...p, step: p.step + 1 }));
      return;
    }
    setBusy(true);
    try {
      const issues = (INTAKE_CHECKS.astand || []).filter((c) => progress.checks[`astand:${c.key}`] === "issue");
      const photoCount = Object.values(progress.photos).reduce((n, arr) => n + arr.length, 0);
      const result = await completeRequest(request.id, {
        location: progress.form.stadsetning || request.unit?.location || "",
        damage: issues.length
          ? {
              description: issues.map((c) => c.label).join(", ") + (progress.form.athugasemd ? ` — ${progress.form.athugasemd}` : ""),
              cause: progress.form.orsok,
              responsible: progress.form.abyrgd || null,
              costIsk: Number(progress.form.kostnadur || 0),
            }
          : null,
      });
      clearProgress(request.id);
      invalidate();
      setDone({
        code: result.unit?.code || request.unit?.code || "—",
        by: progress.form.stadfest_af || "—",
        photos: photoCount,
        issues: issues.length,
        cost: Number(progress.form.kostnadur || 0),
      });
      setScreen("done");
    } catch (e) {
      alert("Ekki tókst að ljúka ferlinu: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (screen === "done" && done) {
    return (
      <section style={{ display: "flex", flexDirection: "column", minHeight: 844, padding: "24px 18px", gap: 20, justifyContent: "center" }}>
        <div className="blueprint" style={{ padding: "26px 20px", display: "flex", flexDirection: "column", gap: 14, textAlign: "center" }}>
          <div style={{ fontSize: 10, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>Ferli lokið</div>
          <h1 style={{ fontSize: 30, margin: 0, lineHeight: 1.05 }}>{done.code} er tilbúin til leigu</h1>
          <div style={{ fontSize: 14, opacity: 0.7, lineHeight: 1.4 }}>Staða einingarinnar var uppfærð í kerfinu og beiðnin merkt lokið. Myndir og ástandsskrá fylgja einingunni.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, textAlign: "left", paddingTop: 10, borderTop: "1px solid var(--color-divider)" }}>
            {[
              ["Staðfest af", done.by],
              ["Myndir skráðar", String(done.photos)],
              ["Skemmdir skráðar", String(done.issues)],
              ["Kostnaður", done.cost ? `${new Intl.NumberFormat("is-IS").format(done.cost)} kr.` : "—"],
            ].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13.5 }}>
                <span style={{ opacity: 0.7 }}>{l}</span>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: 15 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => nav("/")} style={{ minHeight: 52, fontSize: 16 }}>
          Aftur í verk dagsins
        </button>
      </section>
    );
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", minHeight: 844, paddingBottom: 132 }}>
      <header style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--color-bg)", borderBottom: "1px solid var(--color-divider)", padding: "16px 18px 12px" }}>
        <button className="btn btn-ghost" onClick={() => nav("/")} style={{ padding: 0, marginBottom: 8 }}>
          ← Verk dagsins
        </button>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
          <h1 style={{ fontSize: 28, margin: 0, lineHeight: 1, letterSpacing: ".02em" }}>{request.unit?.code ?? "—"}</h1>
          <span style={{ fontSize: 13, opacity: 0.65 }}>{request.unit?.sizeM2 ? `${request.unit.sizeM2} m² · ` : ""}{request.type}</span>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
          {INTAKE_STEPS.map((s, i) => (
            <div key={s.key} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ display: "block", height: 5, background: i <= progress.step ? "var(--color-accent)" : "var(--color-neutral-300)" }} />
              <span style={{ fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", opacity: i === progress.step ? 1 : 0.5 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </header>

      <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>Skref {progress.step + 1} af 4</div>
          <h2 style={{ fontSize: 24, margin: "3px 0 4px", lineHeight: 1.05 }}>{step.title}</h2>
          <div style={{ fontSize: 13.5, opacity: 0.7, lineHeight: 1.4 }}>{step.intro}</div>
        </div>

        {checklist.map((c) => {
          const v = progress.checks[`${stepKey}:${c.key}`];
          const tone = v === "ok" ? TONES.ok : v === "issue" ? TONES.warn : null;
          const note = stepKey === "astand" ? (v === "issue" ? "Athugasemd — krefst myndar" : v === "ok" ? "Í lagi" : `${c.note} · smelltu: í lagi → athugasemd`) : c.note;
          return (
            <button
              key={c.key}
              onClick={() => toggleCheck(c.key)}
              style={{ display: "flex", gap: 13, alignItems: "center", width: "100%", minHeight: 56, padding: "11px 13px", border: `1px solid ${tone ? tone.fg : "var(--color-divider)"}`, background: tone ? tone.bg : "none", cursor: "pointer", font: "inherit", color: "var(--color-text)" }}
            >
              <span style={{ width: 26, height: 26, flex: "none", display: "grid", placeItems: "center", border: `1px solid ${tone ? tone.fg : "var(--color-neutral-400)"}`, color: tone ? tone.fg : "transparent", fontSize: 15, fontFamily: "var(--font-heading)" }}>
                {v === "ok" ? "✓" : v === "issue" ? "!" : ""}
              </span>
              <span style={{ flex: 1, textAlign: "left" }}>
                <span style={{ display: "block", fontSize: 15 }}>{c.label}</span>
                <span style={{ display: "block", fontSize: 12.5, opacity: 0.6 }}>{note}</span>
              </span>
            </button>
          );
        })}

        {stepKey === "mottaka" ? (
          <>
            <div className="field" style={{ margin: 0 }}>
              <label>Staðsetning á lager</label>
              <select className="input" style={{ minHeight: 46 }} value={progress.form.stadsetning || ""} onChange={(e) => setField("stadsetning", e.target.value)}>
                <option value="">— veldu —</option>
                {LOCATIONS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Komutími</label>
              <input className="input" style={{ minHeight: 46 }} value={progress.form.komutimi ?? now()} onChange={(e) => setField("komutimi", e.target.value)} />
            </div>
          </>
        ) : null}

        {stepKey === "astand" && hasIssue ? (
          <>
            <div className="field" style={{ margin: 0 }}>
              <label>Hver olli skemmdinni</label>
              <select className="input" style={{ minHeight: 46 }} value={progress.form.orsok || ""} onChange={(e) => setField("orsok", e.target.value)}>
                <option value="">— veldu —</option>
                {Object.keys(DAMAGE_CAUSE).map((k) => (
                  <option key={k} value={k}>{DAMAGE_CAUSE[k as keyof typeof DAMAGE_CAUSE]}</option>
                ))}
              </select>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Ábyrgðaraðili (nafn / fyrirtæki)</label>
              <input className="input" style={{ minHeight: 46 }} placeholder="t.d. Verkís hf. — Jón Jónsson" value={progress.form.abyrgd || ""} onChange={(e) => setField("abyrgd", e.target.value)} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Athugasemd</label>
              <input className="input" style={{ minHeight: 46 }} placeholder="Stutt lýsing á skemmd" value={progress.form.athugasemd || ""} onChange={(e) => setField("athugasemd", e.target.value)} />
            </div>
          </>
        ) : null}

        {stepKey === "standsetning" ? (
          <div className="field" style={{ margin: 0 }}>
            <label>Kostnaður við standsetningu (ISK)</label>
            <input className="input" style={{ minHeight: 46 }} type="number" placeholder="0" value={progress.form.kostnadur || ""} onChange={(e) => setField("kostnadur", e.target.value)} />
          </div>
        ) : null}

        {stepKey === "tilbuin" ? (
          <div className="field" style={{ margin: 0 }}>
            <label>Staðfest af</label>
            <input className="input" style={{ minHeight: 46 }} placeholder="Nafn starfsmanns" value={progress.form.stadfest_af || ""} onChange={(e) => setField("stadfest_af", e.target.value)} />
          </div>
        ) : null}

        {photoGroups.map((g) => {
          const shots = progress.photos[g.key] || [];
          const okNow = shots.length >= g.min;
          return (
            <div key={g.key} className="blueprint" style={{ padding: "14px 15px", display: "flex", flexDirection: "column", gap: 11 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: 18 }}>{g.title}</span>
                <span className="tag" style={{ background: g.min ? (okNow ? TONES.ok.bg : TONES.warn.bg) : TONES.neutral.bg, color: g.min ? (okNow ? TONES.ok.fg : TONES.warn.fg) : TONES.neutral.fg }}>
                  {g.min ? (okNow ? "Skylda ✓" : "Skylda") : "Valfrjálst"}
                </span>
              </div>
              <div style={{ fontSize: 12.5, opacity: 0.65, lineHeight: 1.35 }}>{g.hint}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {shots.map((src, i) => (
                  <div key={i} className="duotone" style={{ height: 104, position: "relative", overflow: "hidden" }}>
                    <img src={src} alt="Ástandsmynd" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <button
                      onClick={() => removePhoto(g.key, i)}
                      style={{ position: "absolute", right: 4, top: 4, zIndex: 3, width: 26, height: 26, border: "1px solid var(--color-divider)", background: "var(--color-bg)", cursor: "pointer", font: "inherit", fontSize: 13, lineHeight: 1, padding: 0 }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <label style={{ height: 104, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, border: `1px dashed ${okNow ? "var(--color-divider)" : "var(--color-accent)"}`, color: "var(--color-accent-800)", cursor: "pointer" }}>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) addPhoto(g.key, file);
                      e.target.value = "";
                    }}
                    style={{ display: "none" }}
                  />
                  <span style={{ fontSize: 22, lineHeight: 1 }}>＋</span>
                  <span style={{ fontSize: 12.5, letterSpacing: ".06em", textTransform: "uppercase" }}>Taka mynd</span>
                </label>
              </div>
            </div>
          );
        })}

        {stepKey === "astand" && hasIssue ? (
          <div style={{ borderLeft: "3px solid #8a6321", background: "#f0e6d3", color: "#8a6321", padding: "13px 15px", fontSize: 13.5, lineHeight: 1.4 }}>
            {checklist.filter((c) => progress.checks[`astand:${c.key}`] === "issue").length} liðir merktir með athugasemd. Skemmdin skráist sjálfkrafa í ástandsskrá einingarinnar þegar ferlinu lýkur — með orsök, ábyrgðaraðila og myndum.
          </div>
        ) : null}
      </div>

      <div style={{ position: "fixed", bottom: 0, width: 390, background: "var(--color-bg)", borderTop: "1px solid var(--color-text)", padding: "13px 18px 18px", display: "flex", flexDirection: "column", gap: 9 }}>
        {requirements.map((b, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12.5, color: "#8a6321" }}>
            <span style={{ flex: "none", marginTop: 1 }}>✕</span>
            <span>{b}</span>
          </div>
        ))}
        {requirements.length === 0 ? <div style={{ fontSize: 12.5, color: "#3f6b4d" }}>✓ Öll skilyrði uppfyllt — hægt að staðfesta skrefið.</div> : null}
        <button className="btn btn-primary" onClick={next} disabled={requirements.length > 0 || busy} style={{ minHeight: 52, fontSize: 16, width: "100%" }}>
          {busy ? "Vinnur…" : progress.step < 3 ? "Staðfesta skref og halda áfram" : "Setja í Tilbúin til leigu"}
        </button>
      </div>
    </section>
  );
}
