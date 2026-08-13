import { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { RailNav } from "./layout/RailNav.js";
import "./layout/layout.css";
import { Dashboard } from "./pages/Dashboard.js";
import { Units } from "./pages/Units.js";
import { Projects } from "./pages/Projects.js";
import { Requests } from "./pages/Requests.js";
import { Contracts } from "./pages/Contracts.js";
import { DetailPage } from "./pages/Detail/DetailPage.js";
import { Match } from "./pages/Match.js";
import { Sala } from "./pages/Sala.js";
import { Pricing } from "./pages/Pricing.js";
import { Billing } from "./pages/Billing.js";
import { BcIntegration } from "./pages/BcIntegration.js";
import { Users } from "./pages/Users.js";

export function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setDrawerOpen(false), [location.pathname]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg)", color: "var(--color-text)", fontFamily: "var(--font-body)", fontSize: 14 }}>
      <button
        className="rail-toggle btn btn-secondary btn-icon"
        onClick={() => setDrawerOpen((v) => !v)}
        aria-label="Opna valmynd"
        style={{ position: "fixed", top: 14, left: 14, zIndex: 60 }}
      >
        ☰
      </button>
      <div className={`rail-backdrop${drawerOpen ? " open" : ""}`} onClick={() => setDrawerOpen(false)} />
      <RailNav open={drawerOpen} onNavigate={() => setDrawerOpen(false)} />
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/einingar" element={<Units />} />
          <Route path="/verkefni" element={<Projects />} />
          <Route path="/beidnir" element={<Requests />} />
          <Route path="/samningar" element={<Contracts />} />
          <Route path="/porun" element={<Match />} />
          <Route path="/sala" element={<Sala />} />
          <Route path="/verdskra" element={<Pricing />} />
          <Route path="/reikningagerd" element={<Billing />} />
          <Route path="/bc-tenging" element={<BcIntegration />} />
          <Route path="/notendur" element={<Users />} />
          <Route path="/detail/:kind/new" element={<DetailPage isNew />} />
          <Route path="/detail/:kind/:id" element={<DetailPage isNew={false} />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  );
}
