// Resumable in-progress flow state, keyed per request — README.md "Progress is resumable (persisted
// per request)". Only in-flight step/checks/form/photo state lives here; the completed result is
// written to the server via POST /api/vettvangur/requests/:id/complete.
import type { CheckMark } from "@stolpi/shared";

export interface FlowProgress {
  step: number;
  checks: Record<string, CheckMark>;
  form: Record<string, string>;
  photos: Record<string, string[]>; // group -> uploaded photo URLs
}

const EMPTY: FlowProgress = { step: 0, checks: {}, form: {}, photos: {} };

function key(reqId: string) {
  return `stolpi_vettvangur_${reqId}`;
}

export function loadProgress(reqId: string): FlowProgress {
  try {
    const raw = localStorage.getItem(key(reqId));
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw);
    return { ...EMPTY, ...parsed };
  } catch {
    return { ...EMPTY };
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
