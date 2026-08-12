import { Routes, Route } from "react-router-dom";
import { RailNav } from "./layout/RailNav.js";
import { Dashboard } from "./pages/Dashboard.js";
import { Units } from "./pages/Units.js";
import { Projects } from "./pages/Projects.js";
import { Requests } from "./pages/Requests.js";
import { Contracts } from "./pages/Contracts.js";
import { DetailPage } from "./pages/Detail/DetailPage.js";
import { ComingSoon } from "./pages/ComingSoon.js";

export function App() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg)", color: "var(--color-text)", fontFamily: "var(--font-body)", fontSize: 14 }}>
      <RailNav />
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/einingar" element={<Units />} />
          <Route path="/verkefni" element={<Projects />} />
          <Route path="/beidnir" element={<Requests />} />
          <Route path="/samningar" element={<Contracts />} />
          <Route path="/porun" element={<ComingSoon title="Pörun" />} />
          <Route path="/sala" element={<ComingSoon title="Sölukerfi" />} />
          <Route path="/verdskra" element={<ComingSoon title="Verðskrá & tilboð" />} />
          <Route path="/reikningagerd" element={<ComingSoon title="Reikningagerð" />} />
          <Route path="/bc-tenging" element={<ComingSoon title="BC-tenging" />} />
          <Route path="/notendur" element={<ComingSoon title="Notendur & réttindi" />} />
          <Route path="/detail/:kind/new" element={<DetailPage isNew />} />
          <Route path="/detail/:kind/:id" element={<DetailPage isNew={false} />} />
        </Routes>
      </main>
    </div>
  );
}
