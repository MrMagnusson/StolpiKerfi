// Simple (non-intake) job screen — samsetning/uppsetning/viðgerð/flutningur/annað. Unlike the gated
// 4-step móttöku flow (JobFlow.tsx), these jobs aren't about a unit returning to the rental pool, so
// there's no stepper or requirement gate: just a location, a note, optional photos, and one button.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { REQ_TYPE, type ReqType } from "@stolpi/shared";
import { useRequestsInvalidate, completeSimpleRequest, type VettvangurRequest } from "../api.js";
import { downscaleAndUpload } from "../photo.js";

interface DoneInfo {
  photos: number;
}

export function SimpleJobFlow({ request }: { request: VettvangurRequest }) {
  const nav = useNavigate();
  const invalidate = useRequestsInvalidate();
  const [location, setLocation] = useState(request.unit?.location ?? "");
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<DoneInfo | null>(null);

  const addPhoto = async (file: File) => {
    try {
      const url = await downscaleAndUpload(file);
      setPhotos((p) => [...p, url]);
    } catch (e) {
      alert("Ekki tókst að hlaða upp mynd: " + (e as Error).message);
    }
  };
  const removePhoto = (i: number) => setPhotos((p) => p.filter((_, j) => j !== i));

  const finish = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await completeSimpleRequest(request.id, {
        note: note || null,
        photos,
        location: request.unitId && location ? location : null,
      });
      invalidate();
      setDone({ photos: photos.length });
    } catch (e) {
      alert("Ekki tókst að ljúka verki: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <section style={{ display: "flex", flexDirection: "column", minHeight: 844, padding: "24px 18px", gap: 20, justifyContent: "center" }}>
        <div className="blueprint" style={{ padding: "26px 20px", display: "flex", flexDirection: "column", gap: 14, textAlign: "center" }}>
          <div style={{ fontSize: 10, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>Verki lokið</div>
          <h1 style={{ fontSize: 26, margin: 0, lineHeight: 1.1 }}>{request.title}</h1>
          <div style={{ fontSize: 14, opacity: 0.7, lineHeight: 1.4 }}>Beiðnin er merkt lokið{request.unitId ? " og færð í viðhaldssögu einingarinnar." : "."}</div>
          {photos.length ? <div style={{ fontSize: 13.5, opacity: 0.7 }}>{photos.length} mynd{photos.length === 1 ? "" : "ir"} vistaðar</div> : null}
        </div>
        <button className="btn btn-primary" onClick={() => nav("/")} style={{ minHeight: 52, fontSize: 16 }}>
          Aftur í verk dagsins
        </button>
      </section>
    );
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", minHeight: 844, paddingBottom: 110 }}>
      <header style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--color-bg)", borderBottom: "1px solid var(--color-divider)", padding: "16px 18px 12px" }}>
        <button className="btn btn-ghost" onClick={() => nav("/")} style={{ padding: 0, marginBottom: 8 }}>
          ← Verk dagsins
        </button>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
          <h1 style={{ fontSize: 26, margin: 0, lineHeight: 1.1, letterSpacing: ".01em" }}>{request.title}</h1>
        </div>
        <span style={{ fontSize: 13, opacity: 0.65 }}>
          {REQ_TYPE[request.type as ReqType]}{request.unit ? ` · ${request.unit.code}` : ""}
        </span>
      </header>

      <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 18 }}>
        {request.unitId ? (
          <div className="field" style={{ margin: 0 }}>
            <label>Staðsetning einingar</label>
            <input className="input" style={{ minHeight: 46 }} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="t.d. Lager RVK, verkstaður…" />
          </div>
        ) : null}

        <div className="field" style={{ margin: 0 }}>
          <label>Athugasemd</label>
          <textarea className="input" style={{ minHeight: 90 }} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Lýsing á unnu verki…" />
        </div>

        <div className="blueprint" style={{ padding: "14px 15px", display: "flex", flexDirection: "column", gap: 11 }}>
          <span style={{ fontFamily: "var(--font-heading)", fontSize: 18 }}>Myndir af verki</span>
          <div style={{ fontSize: 12.5, opacity: 0.65, lineHeight: 1.35 }}>Valfrjálst — bættu við myndum sem sýna unnið verk.</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {photos.map((src, i) => (
              <div key={i} style={{ height: 104, position: "relative", overflow: "hidden", background: "var(--color-neutral-200)" }}>
                <img src={src} alt="Mynd af verki" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
                <button
                  onClick={() => removePhoto(i)}
                  style={{ position: "absolute", right: 4, top: 4, zIndex: 3, width: 26, height: 26, border: "1px solid var(--color-divider)", background: "var(--color-bg)", cursor: "pointer", font: "inherit", fontSize: 13, lineHeight: 1, padding: 0 }}
                >
                  ✕
                </button>
              </div>
            ))}
            <label style={{ height: 104, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, border: "1px dashed var(--color-divider)", color: "var(--color-accent-800)", cursor: "pointer" }}>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) addPhoto(file);
                  e.target.value = "";
                }}
                style={{ display: "none" }}
              />
              <span style={{ fontSize: 22, lineHeight: 1 }}>＋</span>
              <span style={{ fontSize: 12.5, letterSpacing: ".06em", textTransform: "uppercase" }}>Taka mynd</span>
            </label>
          </div>
        </div>
      </div>

      <div style={{ position: "fixed", bottom: 0, width: 390, background: "var(--color-bg)", borderTop: "1.5px solid var(--color-neutral-400)", padding: "13px 18px 18px" }}>
        <button className="btn btn-primary" onClick={finish} disabled={busy} style={{ minHeight: 52, fontSize: 16, width: "100%" }}>
          {busy ? "Vinnur…" : "Ljúka verki"}
        </button>
      </div>
    </section>
  );
}
