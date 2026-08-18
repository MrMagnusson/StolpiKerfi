// Simple (non-intake) job screen — samsetning/uppsetning/viðgerð/flutningur/annað. Unlike the gated
// 4-step móttöku flow (JobFlow.tsx), these jobs aren't about a unit returning to the rental pool, so
// there's no stepper or requirement gate: just a location, a note, optional photos, and one button.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DAMAGE_CAUSE, REQ_TYPE, type ReqType } from "@stolpi/shared";
import { useRequestsInvalidate, completeSimpleRequest, type VettvangurRequest } from "../api.js";
import { downscaleAndUpload } from "../photo.js";

interface DoneInfo {
  photos: number;
}

export function SimpleJobFlow({ request }: { request: VettvangurRequest }) {
  const nav = useNavigate();
  const invalidate = useRequestsInvalidate();
  const isRepair = request.type === "vidgerd";
  const isDelivery = request.type === "afhending";
  const [location, setLocation] = useState(request.units[0]?.location ?? "");
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [cause, setCause] = useState("");
  const [responsible, setResponsible] = useState("");
  const [cost, setCost] = useState("");
  const [keysHandedOver, setKeysHandedOver] = useState(false);
  const [receivedBy, setReceivedBy] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    if (isRepair && !cause) {
      setError("Veldu hver olli skemmdinni sem var gert við.");
      return;
    }
    if (isDelivery && (!keysHandedOver || !receivedBy.trim())) {
      setError("Staðfestu að lyklar hafi verið afhentir og skráðu hver tók við einingunni.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await completeSimpleRequest(request.id, {
        note: note || null,
        photos,
        location: request.unitIds.length && location ? location : null,
        damage: isRepair ? { cause, responsible: responsible || null, costIsk: Number(cost || 0) } : null,
        delivery: isDelivery ? { keysHandedOver, receivedBy: receivedBy.trim() } : null,
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
          <div style={{ fontSize: 14, opacity: 0.7, lineHeight: 1.4 }}>
            {isDelivery
              ? `Beiðnin er merkt lokið og ${request.unitIds.length === 1 ? "einingin er" : "einingarnar eru"} nú í leigu.`
              : `Beiðnin er merkt lokið${request.unitIds.length ? ` og færð í viðhaldssögu ${request.unitIds.length === 1 ? "einingarinnar" : "eininganna"}.` : "."}`}
          </div>
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
          {REQ_TYPE[request.type as ReqType]}{request.units.length ? ` · ${request.units.map((u) => u.code).join(", ")}` : ""}
        </span>
      </header>

      <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 18 }}>
        {request.unitIds.length ? (
          <div className="field" style={{ margin: 0 }}>
            <label>{request.unitIds.length === 1 ? "Staðsetning einingar" : "Staðsetning eininga"}</label>
            <input className="input" style={{ minHeight: 46 }} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="t.d. Lager RVK, verkstaður…" />
          </div>
        ) : null}

        <div className="field" style={{ margin: 0 }}>
          <label>Athugasemd</label>
          <textarea className="input" style={{ minHeight: 90 }} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Lýsing á unnu verki…" />
        </div>

        {isRepair ? (
          <>
            <div className="field" style={{ margin: 0 }}>
              <label>Hver olli skemmdinni</label>
              <select className="input" style={{ minHeight: 46 }} value={cause} onChange={(e) => setCause(e.target.value)}>
                <option value="">— veldu —</option>
                {Object.keys(DAMAGE_CAUSE).map((k) => (
                  <option key={k} value={k}>{DAMAGE_CAUSE[k as keyof typeof DAMAGE_CAUSE]}</option>
                ))}
              </select>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Ábyrgðaraðili (nafn / fyrirtæki)</label>
              <input className="input" style={{ minHeight: 46 }} placeholder="t.d. Verkís hf. — Jón Jónsson" value={responsible} onChange={(e) => setResponsible(e.target.value)} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Kostnaður við viðgerð (ISK)</label>
              <input className="input" style={{ minHeight: 46 }} type="number" placeholder="0" value={cost} onChange={(e) => setCost(e.target.value)} />
            </div>
          </>
        ) : null}

        {isDelivery ? (
          <>
            <div className="field" style={{ margin: 0 }}>
              <label>Lyklar afhentar</label>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setKeysHandedOver((k) => !k)}
                style={{ minHeight: 46, alignSelf: "flex-start" }}
              >
                {keysHandedOver ? "Já" : "Nei"}
              </button>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Móttekið af (nafn)</label>
              <input className="input" style={{ minHeight: 46 }} placeholder="Nafn viðtakanda" value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} />
            </div>
          </>
        ) : null}

        {error ? <div style={{ fontSize: 13, color: "#8f4038" }}>{error}</div> : null}

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
          {busy ? "Vinnur…" : isDelivery ? "Staðfesta afhendingu" : "Ljúka verki"}
        </button>
      </div>
    </section>
  );
}
