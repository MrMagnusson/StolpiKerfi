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

export function clearUser() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // sama og að ofan
  }
}
