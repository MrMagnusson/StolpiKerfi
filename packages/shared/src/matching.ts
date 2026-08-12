import type { MatchResult, MatchReason, Project, Unit, UnitScore } from "./types.js";
import { STAGE_PROB, type DealStage } from "./enums.js";

/** Diacritic-insensitive, case-insensitive normalization — used for equipment name matching and search. */
export function norm(s: string | null | undefined): string {
  return (s ?? "").toString().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Ported verbatim from Stólpi Kerfi.dc.html scoreUnit() (lines 1138-1161).
 * Max 100: klósett +30/ineligible, stærð +max(8,25-(size-min))/ineligible,
 * búnaður +35×(matched/required) diacritic-insensitive, base +10.
 */
export function scoreUnit(unit: Unit, p: Project): Omit<UnitScore, "unit"> {
  const reasons: MatchReason[] = [];
  let eligible = true;
  let score = 0;
  let max = 0;

  if (p.needsToilet) {
    max += 30;
    if (unit.hasToilet) {
      score += 30;
      reasons.push({ ok: true, text: "Með klósetti — uppfyllir kröfu" });
    } else {
      eligible = false;
      reasons.push({ ok: false, text: "Ekkert klósett — verkefni krefst þess" });
    }
  }

  if (p.minSizeM2) {
    max += 25;
    if ((unit.sizeM2 || 0) >= p.minSizeM2) {
      score += Math.max(8, 25 - (unit.sizeM2 - p.minSizeM2));
      reasons.push({ ok: true, text: `Nógu stór: ${unit.sizeM2} m² ≥ ${p.minSizeM2} m²` });
    } else {
      eligible = false;
      reasons.push({ ok: false, text: `Of lítil: ${unit.sizeM2 || 0} m² < ${p.minSizeM2} m²` });
    }
  }

  const req = p.requiredEquipment || [];
  if (req.length) {
    max += 35;
    const have = req.filter((e) => (unit.equipment || []).some((x) => norm(x) === norm(e)));
    const missing = req.filter((e) => have.indexOf(e) < 0);
    score += Math.round((have.length / req.length) * 35);
    if (have.length) reasons.push({ ok: true, text: `Búnaður til staðar: ${have.join(", ")}` });
    if (missing.length) reasons.push({ ok: false, text: `Vantar búnað: ${missing.join(", ")}` });
  }

  max += 10;
  score += 10;

  return { eligible, score, percent: max ? Math.round((score / max) * 100) : 100, reasons };
}

/** Ported from buildMatch() (Stólpi Kerfi.dc.html lines 1162-1169). Pool = available or returned units. */
export function buildMatch(p: Project, units: Unit[]): MatchResult {
  const pool = units.filter((u) => u.status === "available" || u.status === "returned");
  const scored: UnitScore[] = pool.map((u) => ({ unit: u, ...scoreUnit(u, p) }));
  return {
    eligible: scored.filter((s) => s.eligible).sort((a, b) => b.score - a.score),
    notEligible: scored.filter((s) => !s.eligible).sort((a, b) => b.score - a.score),
  };
}

/** Weighted pipeline value: value × stage probability / 100 (Stólpi Kerfi.dc.html line 982). */
export function weightedDealValue(valueIsk: number, stage: DealStage): number {
  return (valueIsk || 0) * (STAGE_PROB[stage] || 0) / 100;
}

/** Compact ISK formatting used throughout the desktop app (short(), line 979). */
export function short(v: number | null | undefined): string {
  if (v == null) return "—";
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(1).replace(".0", "")} m.kr.`;
  if (Math.abs(v) >= 1e3) return `${Math.round(v / 1e3)} þ.kr.`;
  return `${Math.round(v)} kr.`;
}
