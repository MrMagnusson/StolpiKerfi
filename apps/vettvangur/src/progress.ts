// Resumable in-progress flow state, keyed per request — README.md "Progress is resumable (persisted
// per request)". A request can cover multiple units (e.g. a whole vinnubúðir camp returned at once),
// so progress is nested per unit: each unit walks the step/checks/form/photos flow independently,
// and the request as a whole only completes once every unit is marked done. The completed result is
// written to the server via POST /api/vettvangur/requests/:id/complete.
import type { CheckMark } from "@stolpi/shared";

export interface UnitFlowState {
  step: number;
  checks: Record<string, CheckMark>;
  form: Record<string, string>;
  photos: Record<string, string[]>; // group -> uploaded photo URLs
  done: boolean;
}

export interface FlowProgress {
  activeUnitId: string | null;
  units: Record<string, UnitFlowState>;
}

function emptyUnitState(): UnitFlowState {
  return { step: 0, checks: {}, form: {}, photos: {}, done: false };
}

function key(reqId: string) {
  return `stolpi_vettvangur_${reqId}`;
}

export function loadProgress(reqId: string): FlowProgress {
  try {
    const raw = localStorage.getItem(key(reqId));
    if (!raw) return { activeUnitId: null, units: {} };
    const parsed = JSON.parse(raw);
    return { activeUnitId: parsed.activeUnitId ?? null, units: parsed.units ?? {} };
  } catch {
    return { activeUnitId: null, units: {} };
  }
}

export function saveProgress(reqId: string, progress: FlowProgress) {
  try {
    localStorage.setItem(key(reqId), JSON.stringify(progress));
  } catch {
    // ignore quota errors
  }
}

export function clearProgress(reqId: string) {
  try {
    localStorage.removeItem(key(reqId));
  } catch {
    // ignore
  }
}

/** Reads one unit's flow state out of a request's progress, defaulting to a fresh (untouched) state. */
export function unitState(progress: FlowProgress, unitId: string): UnitFlowState {
  return progress.units[unitId] ?? emptyUnitState();
}
