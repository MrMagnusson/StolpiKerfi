import type { Unit } from "./types.js";

/** Display size for a unit — fet (the measurement actually used on units) when set, otherwise
 * lengd × breidd in meters for non-standard sizes, otherwise the legacy m² figure. */
export function formatUnitSize(u: Pick<Unit, "sizeFt" | "lengthM" | "widthM" | "sizeM2">): string {
  if (u.sizeFt != null) return `${short1(u.sizeFt)} ft`;
  if (u.lengthM != null && u.widthM != null) return `${short1(u.lengthM)} × ${short1(u.widthM)} m`;
  if (u.sizeM2 != null) return `${u.sizeM2} m²`;
  return "—";
}

function short1(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ",");
}
