// Forsíða Vettvangs — starfsmaðurinn velur sig úr lista (munað á tækinu, sjá user.ts) og fær
// yfirlit yfir sín verk áður en hann fer í verkalistann. Stjórnandinn úthlutar beiðnum á
// starfsmenn á skrifborðinu (Ábyrgð-reiturinn) og fylgist þar með framvindu.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRequests, useUsers } from "../api.js";
import { loadUser, saveUser, clearUser } from "../user.js";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function Home() {
  const nav = useNavigate();
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const { data: requests = [] } = useRequests();
  const [user, setUser] = useState<string | null>(loadUser());

  const pick = (name: string) => {
    saveUser(name);
    setUser(name);
  };
  const switchUser = () => {
    clearUser();
    setUser(null);
  };

  const staff = users.filter((u) => u.active);
  const today = todayIso();
  const open = requests.filter((r) => r.status === "ny" || r.status === "i_vinnslu");
  const mine = open.filter((r) => r.assignedTo === user);
  const mineToday = mine.filter((r) => !r.dueDate || r.dueDate <= today);
  const mineOverdue = mine.filter((r) => r.dueDate && r.dueDate < today);

  if (!user) {
    return (
      <section style={{ display: "flex", flexDirection: "column", minHeight: 844, padding: "40px 18px 30px", gap: 22 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 10, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>Stólpi · Vettvangur</div>
          <h1 style={{ fontSize: 30, margin: "6px 0 0", lineHeight: 1.1 }}>Hver ert þú?</h1>
          <div style={{ fontSize: 14, opacity: 0.65, marginTop: 8 }}>Veldu nafnið þitt — verkin þín birtast þá á forsíðunni.</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {usersLoading ? <div style={{ opacity: 0.6, padding: "16px 0", textAlign: "center" }}>Hleð…</div> : null}
          {staff.map((u) => (
            <button
              key={u.id}
              className="blueprint"
              onClick={() => pick(u.name)}
              style={{ padding: "16px 17px", background: "none", border: 0, cursor: "pointer", textAlign: "left", font: "inherit", display: "flex", alignItems: "center", gap: 13 }}
            >
              <span style={{ width: 40, height: 40, flex: "none", display: "grid", placeItems: "center", border: "1px solid var(--color-divider)", fontFamily: "var(--font-heading)", fontSize: 15 }}>
                {u.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
              </span>
              <span style={{ fontSize: 16 }}>{u.name}</span>
            </button>
          ))}
          {!usersLoading && !staff.length ? (
            <div style={{ border: "1px dashed var(--color-divider)", padding: "24px 16px", textAlign: "center", fontSize: 14, opacity: 0.6 }}>
              Engir virkir notendur — stofnaðu notendur í skrifborðskerfinu (Notendur & réttindi).
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", minHeight: 844, padding: "26px 18px 30px", gap: 18 }}>
      <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>Stólpi · Vettvangur</div>
          <h1 style={{ fontSize: 28, margin: "4px 0 0", lineHeight: 1.1 }}>Góðan dag, {user.split(" ")[0]}</h1>
        </div>
        <button
          className="blueprint"
          onClick={switchUser}
          title="Skipta um notanda"
          style={{ width: 42, height: 42, flex: "none", display: "grid", placeItems: "center", fontFamily: "var(--font-heading)", fontSize: 14, background: "none", border: 0, cursor: "pointer", color: "var(--color-text)" }}
        >
          {user.split(" ").map((p) => p[0]).slice(0, 2).join("")}
        </button>
      </header>

      <div className="blueprint" style={{ padding: "18px 17px", display: "flex", flexDirection: "column", gap: 12 }}>
        <span style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", opacity: 0.55 }}>Mín verk</span>
        <div style={{ display: "flex", gap: 20 }}>
          <div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 34, lineHeight: 1 }}>{mineToday.length}</div>
            <div style={{ fontSize: 12.5, opacity: 0.65, marginTop: 3 }}>í dag</div>
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 34, lineHeight: 1 }}>{mine.length}</div>
            <div style={{ fontSize: 12.5, opacity: 0.65, marginTop: 3 }}>opin alls</div>
          </div>
          {mineOverdue.length ? (
            <div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 34, lineHeight: 1, color: "#8f4038" }}>{mineOverdue.length}</div>
              <div style={{ fontSize: 12.5, color: "#8f4038", marginTop: 3 }}>yfir tíma</div>
            </div>
          ) : null}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        <button className="btn btn-primary" onClick={() => nav("/verk?minn=1")} style={{ minHeight: 54, fontSize: 16 }}>
          Mín verk{mine.length ? ` (${mine.length})` : ""}
        </button>
        <button className="btn btn-secondary" onClick={() => nav("/verk")} style={{ minHeight: 50, fontSize: 15 }}>
          Öll verk dagsins{open.length ? ` (${open.length})` : ""}
        </button>
        <button className="btn btn-secondary" onClick={() => nav("/nytt")} style={{ minHeight: 50, fontSize: 15 }}>
          + Nýtt verk
        </button>
      </div>

      {mine.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", opacity: 0.55 }}>Næstu verk</span>
          {mine.slice(0, 3).map((r) => (
            <button
              key={r.id}
              className="blueprint"
              onClick={() => nav(`/verk/${r.id}`)}
              style={{ padding: "13px 14px", background: "none", border: 0, cursor: "pointer", textAlign: "left", font: "inherit", display: "flex", flexDirection: "column", gap: 5 }}
            >
              <span style={{ fontSize: 14.5, lineHeight: 1.3 }}>{r.title}</span>
              <span style={{ fontSize: 12.5, opacity: 0.6 }}>
                {r.units.map((u) => u.code).join(", ") || "—"}{r.dueDate ? ` · skiladagur ${r.dueDate}` : ""}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
