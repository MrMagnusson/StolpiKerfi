import { NavLink } from "react-router-dom";
import { useList } from "../api.js";

interface NavItem {
  to: string;
  label: string;
  count?: number | string;
}
interface NavGroup {
  title: string;
  items: NavItem[];
}

/** Sticky left rail — 242px, brand block + three grouped sections + user footer. README.md "Desktop app — screens".
 * Below ~900px it becomes a slide-in drawer (see layout.css) — `open`/`onNavigate` drive that state. */
export function RailNav({ open = false, onNavigate }: { open?: boolean; onNavigate?: () => void }) {
  const { data: units = [] } = useList<{ id: string; status: string }>("units");
  const { data: projects = [] } = useList<{ id: string }>("projects");
  const { data: requests = [] } = useList<{ id: string; status: string }>("requests");
  const { data: deals = [] } = useList<{ id: string; stage: string }>("deals");
  const { data: quotes = [] } = useList<{ id: string }>("quotes");
  const { data: users = [] } = useList<{ id: string }>("users");

  const openRequests = requests.filter((r) => r.status === "ny" || r.status === "i_vinnslu").length;
  const openDeals = deals.filter((d) => d.stage !== "unnid" && d.stage !== "tapad").length;

  const groups: NavGroup[] = [
    {
      title: "Rekstur",
      items: [
        { to: "/", label: "Yfirlit" },
        { to: "/einingar", label: "Einingar", count: units.length },
        { to: "/verkefni", label: "Verkefni", count: projects.length },
        { to: "/porun", label: "Pörun" },
        { to: "/beidnir", label: "Beiðnir", count: openRequests },
      ],
    },
    {
      title: "Sala",
      items: [
        { to: "/sala", label: "Sölukerfi", count: openDeals },
        { to: "/samningar", label: "Samningar" },
        { to: "/verdskra", label: "Verðskrá & tilboð", count: quotes.length },
        { to: "/reikningagerd", label: "Reikningagerð" },
      ],
    },
    {
      title: "Kerfi",
      items: [
        { to: "/bc-tenging", label: "BC-tenging" },
        { to: "/notendur", label: "Notendur & réttindi", count: users.length },
      ],
    },
  ];

  return (
    <aside className={`rail-nav${open ? " open" : ""}`} style={{ width: 242, flex: "none", borderRight: "1px solid var(--color-divider)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--color-divider)", display: "flex", gap: 11, alignItems: "center" }}>
        <div className="blueprint" style={{ width: 30, height: 30, flex: "none", display: "grid", placeItems: "center", background: "var(--color-accent)", color: "var(--color-bg)", fontFamily: "var(--font-heading)", fontSize: 17, lineHeight: 1 }}>
          S
          <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 18, lineHeight: 1, letterSpacing: ".02em" }}>STÓLPI</div>
          <div style={{ fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", opacity: 0.55, marginTop: 3 }}>Rekstrarkerfi</div>
        </div>
      </div>
      <nav style={{ display: "flex", flexDirection: "column", padding: "8px 0 14px", flex: 1, overflowY: "auto" }}>
        {groups.map((g) => (
          <div key={g.title}>
            <div style={{ padding: "14px 20px 6px", fontSize: 10, letterSpacing: ".18em", textTransform: "uppercase", opacity: 0.42 }}>{g.title}</div>
            {g.items.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                onClick={onNavigate}
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 20px",
                  border: 0,
                  background: isActive ? "var(--color-accent-100)" : "none",
                  color: isActive ? "var(--color-accent-900)" : "var(--color-text)",
                  textDecoration: "none",
                  fontSize: 14,
                  opacity: isActive ? 1 : 0.75,
                })}
              >
                {({ isActive }: { isActive: boolean }) => (
                  <>
                    <span style={{ width: 8, height: 8, flex: "none", border: `1px solid ${isActive ? "var(--color-accent)" : "var(--color-neutral-400)"}`, background: isActive ? "var(--color-accent)" : "transparent" }} />
                    <span style={{ flex: 1, textAlign: "left" }}>{n.label}</span>
                    {n.count !== undefined ? <span style={{ fontFamily: "var(--font-heading)", fontSize: 13, opacity: 0.55 }}>{n.count}</span> : null}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div style={{ borderTop: "1px solid var(--color-divider)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 28, height: 28, flex: "none", border: "1px solid var(--color-divider)", display: "grid", placeItems: "center", fontFamily: "var(--font-heading)", fontSize: 13 }}>KA</div>
        <div style={{ lineHeight: 1.25 }}>
          <div style={{ fontSize: 13 }}>Kalli Andrésson</div>
          <div style={{ fontSize: 11, opacity: 0.55 }}>Sölustjóri · Kerfisstjóri</div>
        </div>
      </div>
    </aside>
  );
}
