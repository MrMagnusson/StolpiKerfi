// Ported from Screen B "Skilyrt ferli" + Screen C "Lokið", Stólpi Vettvangur.dc.html lines 64-180 &
// the requirements()/next() logic at lines 279-320. This is the core requirement of the design —
// the primary button stays disabled until every unmet requirement for the current step is resolved.
// Extended to cover requests with MULTIPLE units (e.g. a whole vinnubúðir camp returned at once):
// each unit walks the step/checklist/photo flow independently (condition and damage are inherently
// per physical unit), switchable via the chip row below the header; the request as a whole is only
// submitted to the server once every unit has been confirmed through its final step.
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  DAMAGE_CAUSE, INTAKE_CHECKS, REQ_TYPE, TONES, formatIntakePhoto, intakeStepsFor, isIntakeReqType,
  type CheckMark, type ReqType,
} from "@stolpi/shared";
import { useRequests, useRequestsInvalidate, completeRequest } from "../api.js";
import { loadProgress, saveProgress, clearProgress, unitState, type FlowProgress, type UnitFlowState } from "../progress.js";
import { downscaleAndUpload } from "../photo.js";
import { SimpleJobFlow } from "./SimpleJobFlow.js";

const LOCATIONS = ["Lager RVK", "Lager Akureyri", "Verkstæði"];
const REPORT_GROUPS = ["koma", "standsett", "astand_inni", "astand_uti", "yfirlit"];

function now(): string {
  return new Date().toTimeString().slice(0, 5);
}

function resolveActiveUnitId(p: FlowProgress, unitIds: string[]): string {
  if (p.activeUnitId && unitIds.includes(p.activeUnitId)) return p.activeUnitId;
  return unitIds.find((id) => !unitState(p, id).done) ?? unitIds[0] ?? "";
}

interface DoneInfo {
  units: { code: string; issues: number }[];
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
  const steps = intakeStepsFor(request?.type ?? "mottaka");
  const unitIds = request?.unitIds ?? [];
  const unitInfo = (unitId: string) => request?.units.find((u) => u.id === unitId);

  const [progress, setProgress] = useState<FlowProgress>(() => loadProgress(id));
  const [screen, setScreen] = useState<"flow" | "done">("flow");
  const [done, setDone] = useState<DoneInfo | null>(null);
  const [busy, setBusy] = useState(false);
  // When every unit is marked done, we default to a review/submit screen — but clicking a unit's
  // chip from there re-opens its step flow (e.g. to double-check a photo) without losing its "done"
  // mark; forceFlowView drops back to the review screen once that unit is confirmed again.
  const [forceFlowView, setForceFlowView] = useState(false);

  useEffect(() => {
    setProgress(loadProgress(id));
    setForceFlowView(false);
  }, [id]);

  useEffect(() => {
    if (screen === "flow") saveProgress(id, progress);
  }, [id, progress, screen]);

  const activeUnitId = resolveActiveUnitId(progress, unitIds);
  const us = unitState(progress, activeUnitId);
  const allDone = unitIds.length > 0 && unitIds.every((uid) => unitState(progress, uid).done);

  const step = steps[us.step];
  const stepKey = step?.key;
  const checklist = stepKey ? INTAKE_CHECKS[stepKey] : [];
  const hasIssue = stepKey === "astand" && checklist.some((c) => us.checks[`astand:${c.key}`] === "issue");

  const photoGroups = useMemo(() => {
    if (!stepKey) return [];
    if (stepKey === "mottaka") return [{ key: "koma", title: "Mynd við komu", hint: "Yfirlitsmynd af einingunni eins og hún kom úr flutningi.", min: 1 }];
    if (stepKey === "astand") {
      // Issue photos are captured inline per checklist item below (see the "issue" expand block) —
      // this shared group only covers the no-issue case (optional overview shots).
      return hasIssue
        ? []
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
    const ph = (g: string) => (us.photos[g] || []).length;
    const unrated = checklist.filter((c) => !us.checks[`${stepKey}:${c.key}`]);
    if (unrated.length) need.push(`${unrated.length} liðir eftir í gátlista: ${unrated.map((c) => c.label).join(", ")}`);
    if (stepKey === "mottaka" && ph("koma") < 1) need.push("Mynd af einingu við komu vantar (1 skylda)");
    if (stepKey === "mottaka" && !us.form.stadsetning) need.push("Staðsetning á lager ekki valin");
    if (stepKey === "astand" && hasIssue) {
      const issueItems = checklist.filter((c) => us.checks[`astand:${c.key}`] === "issue");
      for (const c of issueItems) {
        if (!(us.form[`lysing:${c.key}`] || "").trim()) need.push(`Lýsing vantar — ${c.label}`);
        if (ph(`skemmd:${c.key}`) < 1) need.push(`Mynd vantar — ${c.label}`);
      }
      if (!us.form.orsok) need.push("Velja þarf hver olli skemmdinni");
      if (!us.form.abyrgd) need.push("Skrá þarf nafn ábyrgðaraðila");
    }
    if (stepKey === "standsetning" && ph("standsett") < 1) need.push("Mynd eftir standsetningu vantar (1 skylda)");
    if (stepKey === "tilbuin" && ph("astand_inni") < 1) need.push("Ástandsmynd að innan vantar");
    if (stepKey === "tilbuin" && ph("astand_uti") < 1) need.push("Ástandsmynd að utan vantar");
    if (stepKey === "tilbuin" && !us.form.stadfest_af) need.push("Nafn þess sem staðfestir vantar");
    return need;
  }, [stepKey, checklist, us, hasIssue]);

  if (!request) {
    return <div style={{ padding: 28, opacity: 0.6 }}>Hleð…</div>;
  }

  if (!isIntakeReqType(request.type)) {
    return <SimpleJobFlow request={request} />;
  }

  if (!unitIds.length) {
    return <div style={{ padding: 28, opacity: 0.6 }}>Engin eining tengd þessari beiðni.</div>;
  }

  const updateUnit = (unitId: string, fn: (u: UnitFlowState) => UnitFlowState) => {
    setProgress((p) => ({ ...p, activeUnitId: unitId, units: { ...p.units, [unitId]: fn(unitState(p, unitId)) } }));
  };
  const setActiveUnitId = (unitId: string) => setProgress((p) => ({ ...p, activeUnitId: unitId }));

  const toggleCheck = (key: string) => {
    updateUnit(activeUnitId, (u) => {
      const id2 = `${stepKey}:${key}`;
      const cur = u.checks[id2];
      const next: CheckMark = cur === "ok" ? "issue" : cur === "issue" ? null : "ok";
      return { ...u, checks: { ...u.checks, [id2]: next } };
    });
  };
  const setField = (key: string, value: string) => updateUnit(activeUnitId, (u) => ({ ...u, form: { ...u.form, [key]: value } }));

  const addPhoto = async (group: string, file: File) => {
    try {
      const url = await downscaleAndUpload(file);
      updateUnit(activeUnitId, (u) => ({ ...u, photos: { ...u.photos, [group]: [...(u.photos[group] || []), url] } }));
    } catch (e) {
      alert("Ekki tókst að hlaða upp mynd: " + (e as Error).message);
    }
  };
  const removePhoto = (group: string, i: number) =>
    updateUnit(activeUnitId, (u) => ({ ...u, photos: { ...u.photos, [group]: (u.photos[group] || []).filter((_, j) => j !== i) } }));

  const openUnit = (unitId: string) => {
    setActiveUnitId(unitId);
    setForceFlowView(true);
  };

  const next = () => {
    if (requirements.length || busy) return;
    if (us.step < steps.length - 1) {
      updateUnit(activeUnitId, (u) => ({ ...u, step: u.step + 1 }));
      return;
    }
    updateUnit(activeUnitId, (u) => ({ ...u, done: true }));
    setForceFlowView(false);
    const nextUnit = unitIds.find((uid) => uid !== activeUnitId && !unitState(progress, uid).done);
    if (nextUnit) setActiveUnitId(nextUnit);
  };

  const submitAll = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const reportPhotos: string[] = [];
      const unitsPayload = unitIds.map((unitId) => {
        const u = unitState(progress, unitId);
        for (const group of REPORT_GROUPS) {
          for (const url of u.photos[group] || []) reportPhotos.push(formatIntakePhoto(unitId, group, url));
        }
        const issues = (INTAKE_CHECKS.astand || []).filter((c) => u.checks[`astand:${c.key}`] === "issue");
        const damages = issues.map((c, i) => ({
          description: (u.form[`lysing:${c.key}`] || "").trim() || c.label,
          cause: u.form.orsok,
          responsible: u.form.abyrgd || null,
          // Refurbishment cost is asked once per unit (step 3), not per damage — attribute it to the
          // first damage only so cost-summary panels elsewhere don't multiply it by issue count.
          costIsk: i === 0 ? Number(u.form.kostnadur || 0) : 0,
          photos: u.photos[`skemmd:${c.key}`] || [],
        }));
        return { unitId, location: u.form.stadsetning || unitInfo(unitId)?.location || "", damages };
      });

      await completeRequest(request.id, { photos: reportPhotos, units: unitsPayload });
      clearProgress(request.id);
      invalidate();

      let totalPhotos = 0, totalIssues = 0, totalCost = 0, lastBy = "—";
      const unitSummaries = unitIds.map((unitId) => {
        const u = unitState(progress, unitId);
        totalPhotos += Object.values(u.photos).reduce((n, arr) => n + arr.length, 0);
        const issues = (INTAKE_CHECKS.astand || []).filter((c) => u.checks[`astand:${c.key}`] === "issue").length;
        totalIssues += issues;
        totalCost += Number(u.form.kostnadur || 0);
        if (u.form.stadfest_af) lastBy = u.form.stadfest_af;
        return { code: unitInfo(unitId)?.code ?? "—", issues };
      });
      setDone({ units: unitSummaries, by: lastBy, photos: totalPhotos, issues: totalIssues, cost: totalCost });
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
          <h1 style={{ fontSize: 26, margin: 0, lineHeight: 1.1 }}>
            {done.units.length > 1 ? `${done.units.length} einingar tilbúnar til leigu` : `${done.units[0]?.code ?? "—"} er tilbúin til leigu`}
          </h1>
          {done.units.length > 1 ? (
            <div style={{ fontSize: 13.5, opacity: 0.8 }}>{done.units.map((u) => u.code).join(", ")}</div>
          ) : null}
          <div style={{ fontSize: 14, opacity: 0.7, lineHeight: 1.4 }}>Staða einingunum var uppfærð í kerfinu og beiðnin merkt lokið. Myndir og ástandsskrá fylgja hverri einingu.</div>
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
          Aftur á forsíðu
        </button>
        <button className="btn btn-secondary" onClick={() => nav("/verk")} style={{ minHeight: 48, fontSize: 15 }}>
          Verk dagsins
        </button>
      </section>
    );
  }

  const unitSwitcher = unitIds.length > 1 ? (
    <div style={{ display: "flex", gap: 8, padding: "10px 18px", overflowX: "auto", borderBottom: "1px solid var(--color-divider)" }}>
      {unitIds.map((uid) => {
        const u = unitState(progress, uid);
        const active = uid === activeUnitId && (forceFlowView || !allDone);
        const tone = u.done ? TONES.ok : null;
        return (
          <button
            key={uid}
            onClick={() => openUnit(uid)}
            style={{
              flex: "none", padding: "8px 12px", cursor: "pointer", font: "inherit", fontSize: 13, whiteSpace: "nowrap",
              border: `1px solid ${active ? "var(--color-accent)" : tone ? tone.fg : "var(--color-divider)"}`,
              background: active ? "var(--color-accent)" : tone ? tone.bg : "none",
              color: active ? "var(--color-bg)" : tone ? tone.fg : "var(--color-text)",
            }}
          >
            {u.done ? "✓ " : ""}{unitInfo(uid)?.code ?? "—"}
          </button>
        );
      })}
    </div>
  ) : null;

  if (allDone && !forceFlowView) {
    return (
      <section style={{ display: "flex", flexDirection: "column", minHeight: 844, paddingBottom: 110 }}>
        <header style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--color-bg)", borderBottom: "1px solid var(--color-divider)", padding: "16px 18px 12px" }}>
          <button className="btn btn-ghost" onClick={() => nav("/verk")} style={{ padding: 0, marginBottom: 8 }}>
            ← Verk dagsins
          </button>
          <h1 style={{ fontSize: 26, margin: 0, lineHeight: 1.1 }}>{request.title}</h1>
        </header>
        {unitSwitcher}
        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 14, lineHeight: 1.4 }}>Allar {unitIds.length} einingar hafa verið yfirfarnar. Ýttu á hnappinn til að ljúka móttöku og senda inn ástandsskrá fyrir þær allar.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {unitIds.map((uid) => {
              const u = unitState(progress, uid);
              const issues = (INTAKE_CHECKS.astand || []).filter((c) => u.checks[`astand:${c.key}`] === "issue").length;
              return (
                <div key={uid} className="blueprint" style={{ padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: 16 }}>{unitInfo(uid)?.code ?? "—"}</span>
                  <span className="tag" style={{ background: issues ? TONES.warn.bg : TONES.ok.bg, color: issues ? TONES.warn.fg : TONES.ok.fg }}>
                    {issues ? `${issues} skemmd${issues === 1 ? "" : "ir"}` : "Í lagi"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ position: "fixed", bottom: 0, width: 390, background: "var(--color-bg)", borderTop: "1.5px solid var(--color-neutral-400)", padding: "13px 18px 18px" }}>
          <button className="btn btn-primary" onClick={submitAll} disabled={busy} style={{ minHeight: 52, fontSize: 16, width: "100%" }}>
            {busy ? "Vinnur…" : "Ljúka móttöku"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", minHeight: 844, paddingBottom: 132 }}>
      <header style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--color-bg)", borderBottom: "1px solid var(--color-divider)", padding: "16px 18px 12px" }}>
        <button className="btn btn-ghost" onClick={() => nav("/verk")} style={{ padding: 0, marginBottom: 8 }}>
          ← Verk dagsins
        </button>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
          <h1 style={{ fontSize: 28, margin: 0, lineHeight: 1, letterSpacing: ".02em" }}>{unitInfo(activeUnitId)?.code ?? "—"}</h1>
          <span style={{ fontSize: 13, opacity: 0.65 }}>{unitInfo(activeUnitId)?.sizeM2 ? `${unitInfo(activeUnitId)?.sizeM2} m² · ` : ""}{REQ_TYPE[request.type as ReqType] ?? request.type}</span>
        </div>
        {unitIds.length > 1 ? <div style={{ fontSize: 12, opacity: 0.6, marginTop: 3 }}>{request.title}</div> : null}
        <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
          {steps.map((s, i) => (
            <div key={s.key} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ display: "block", height: 5, background: i <= us.step ? "var(--color-accent)" : "var(--color-neutral-300)" }} />
              <span style={{ fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", opacity: i === us.step ? 1 : 0.5 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </header>

      {unitSwitcher}

      <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>Skref {us.step + 1} af {steps.length}</div>
          <h2 style={{ fontSize: 24, margin: "3px 0 4px", lineHeight: 1.05 }}>{step.title}</h2>
          <div style={{ fontSize: 13.5, opacity: 0.7, lineHeight: 1.4 }}>{step.intro}</div>
        </div>

        {checklist.map((c) => {
          const v = us.checks[`${stepKey}:${c.key}`];
          const tone = v === "ok" ? TONES.ok : v === "issue" ? TONES.warn : null;
          const note = stepKey === "astand" ? (v === "issue" ? "Athugasemd — lýsing og mynd að neðan" : v === "ok" ? "Í lagi" : `${c.note} · smelltu: í lagi → athugasemd`) : c.note;
          const itemPhotos = us.photos[`skemmd:${c.key}`] || [];
          return (
            <div key={c.key} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
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

              {stepKey === "astand" && v === "issue" ? (
                <div style={{ marginLeft: 13, padding: "12px 13px", border: `1px solid ${TONES.warn.fg}`, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div className="field" style={{ margin: 0 }}>
                    <label>Lýsing á skemmd</label>
                    <input
                      className="input"
                      style={{ minHeight: 42 }}
                      placeholder="Stutt lýsing á skemmdinni"
                      value={us.form[`lysing:${c.key}`] || ""}
                      onChange={(e) => setField(`lysing:${c.key}`, e.target.value)}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {itemPhotos.map((src, i) => (
                      <div key={i} style={{ height: 90, position: "relative", overflow: "hidden", background: "var(--color-neutral-200)" }}>
                        <img src={src} alt="Mynd af skemmd" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
                        <button
                          onClick={() => removePhoto(`skemmd:${c.key}`, i)}
                          style={{ position: "absolute", right: 4, top: 4, zIndex: 3, width: 24, height: 24, border: "1px solid var(--color-divider)", background: "var(--color-bg)", cursor: "pointer", font: "inherit", fontSize: 12, lineHeight: 1, padding: 0 }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <label style={{ height: 90, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, border: `1px dashed ${itemPhotos.length ? "var(--color-divider)" : "var(--color-accent)"}`, color: "var(--color-accent-800)", cursor: "pointer" }}>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) addPhoto(`skemmd:${c.key}`, file);
                          e.target.value = "";
                        }}
                        style={{ display: "none" }}
                      />
                      <span style={{ fontSize: 18, lineHeight: 1 }}>＋</span>
                      <span style={{ fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase" }}>Taka mynd</span>
                    </label>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}

        {stepKey === "mottaka" ? (
          <>
            <div className="field" style={{ margin: 0 }}>
              <label>Staðsetning á lager</label>
              <select className="input" style={{ minHeight: 46 }} value={us.form.stadsetning || ""} onChange={(e) => setField("stadsetning", e.target.value)}>
                <option value="">— veldu —</option>
                {LOCATIONS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Komutími</label>
              <input className="input" style={{ minHeight: 46 }} value={us.form.komutimi ?? now()} onChange={(e) => setField("komutimi", e.target.value)} />
            </div>
          </>
        ) : null}

        {stepKey === "astand" && hasIssue ? (
          <>
            <div className="field" style={{ margin: 0 }}>
              <label>Hver olli skemmdinni</label>
              <select className="input" style={{ minHeight: 46 }} value={us.form.orsok || ""} onChange={(e) => setField("orsok", e.target.value)}>
                <option value="">— veldu —</option>
                {Object.keys(DAMAGE_CAUSE).map((k) => (
                  <option key={k} value={k}>{DAMAGE_CAUSE[k as keyof typeof DAMAGE_CAUSE]}</option>
                ))}
              </select>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Ábyrgðaraðili (nafn / fyrirtæki)</label>
              <input className="input" style={{ minHeight: 46 }} placeholder="t.d. Verkís hf. — Jón Jónsson" value={us.form.abyrgd || ""} onChange={(e) => setField("abyrgd", e.target.value)} />
            </div>
          </>
        ) : null}

        {stepKey === "standsetning" ? (
          <div className="field" style={{ margin: 0 }}>
            <label>Kostnaður við standsetningu (ISK)</label>
            <input className="input" style={{ minHeight: 46 }} type="number" placeholder="0" value={us.form.kostnadur || ""} onChange={(e) => setField("kostnadur", e.target.value)} />
          </div>
        ) : null}

        {stepKey === "tilbuin" ? (
          <div className="field" style={{ margin: 0 }}>
            <label>Staðfest af</label>
            <input className="input" style={{ minHeight: 46 }} placeholder="Nafn starfsmanns" value={us.form.stadfest_af || ""} onChange={(e) => setField("stadfest_af", e.target.value)} />
          </div>
        ) : null}

        {photoGroups.map((g) => {
          const shots = us.photos[g.key] || [];
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
                  <div key={i} style={{ height: 104, position: "relative", overflow: "hidden", background: "var(--color-neutral-200)" }}>
                    <img src={src} alt="Ástandsmynd" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
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
            {checklist.filter((c) => us.checks[`astand:${c.key}`] === "issue").length} liðir merktir með athugasemd. Skemmdin skráist sjálfkrafa í ástandsskrá einingarinnar þegar ferlinu lýkur — með orsök, ábyrgðaraðila og myndum.
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
          {us.step < steps.length - 1 ? "Staðfesta skref og halda áfram" : unitIds.length > 1 ? "Staðfesta einingu" : "Setja í Tilbúin til leigu"}
        </button>
      </div>
    </section>
  );
}
