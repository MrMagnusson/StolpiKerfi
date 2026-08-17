import { Routes, Route } from "react-router-dom";
import { JobList } from "./screens/JobList.js";
import { JobFlow } from "./screens/JobFlow.js";
import { NewJob } from "./screens/NewJob.js";

/** 390×844 fixed-width shell — README.md "Mobile app — Vettvangur". */
export function App() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-neutral-300)", display: "flex", justifyContent: "center" }}>
      <div style={{ width: 390, minHeight: 844, margin: "0 auto", background: "var(--color-bg)", color: "var(--color-text)", fontFamily: "var(--font-body)", fontSize: 15, display: "flex", flexDirection: "column", position: "relative" }}>
        <Routes>
          <Route path="/" element={<JobList />} />
          <Route path="/nytt" element={<NewJob />} />
          <Route path="/verk/:id" element={<JobFlow />} />
        </Routes>
      </div>
    </div>
  );
}
