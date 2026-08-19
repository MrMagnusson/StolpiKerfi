// Hver er að nota símann — einfalt nafnaval á forsíðunni (engin lykilorð/innskráning á þessu
// stigi), munað staðbundið á tækinu svo starfsmaðurinn velji sig bara einu sinni.
const KEY = "stolpi_vettvangur_user";

export function loadUser(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function saveUser(name: string) {
  try {
    localStorage.setItem(KEY, name);
  } catch {
    // localStorage óaðgengilegt (private mode) — valið gleymist þá bara við endurhleðslu
  }
}

/** Upphafsstafir fyrir avatar-reitinn — "Bogi lagerstjóri" → "BL". */
export function initials(name: string): string {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function clearUser() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // sama og að ofan
  }
}
