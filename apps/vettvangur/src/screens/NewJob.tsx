// Field-initiated job creation — README.md gap: previously only the desktop Beiðnir page could
// create a ServiceRequest. Lets a technician log work discovered on-site (assembly, setup, repairs,
// or a unit turning up for return with no advance notice) without waiting on the office, using the
// same generic POST /api/requests the desktop uses.
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PRIORITY, REQ_TYPE, isIntakeReqType, norm, type Priority, type ReqType } from "@stolpi/shared";
import { useContracts, useCreateRequest, useUnits } from "../api.js";

const TYPE_OPTIONS = Object.keys(REQ_TYPE) as ReqType[];
const PRIORITY_OPTIONS = Object.keys(PRIORITY) as Priority[];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function NewJob() {
  const nav = useNavigate();
  const { data: units = [] } = useUnits();
  const { data: contracts = [] } = useContracts();
  const create = useCreateRequest();

  const [title, setTitle] = useState("");
  const [type, setType] = useState<ReqType>("mottaka");
  const [unitIds, setUnitIds] = useState<string[]>([]);
  const [unitQuery, setUnitQuery] = useState("");
  const [contractId, setContractId] = useState("");
  const [priority, setPriority] = useState<Priority>("medal");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isIntake = isIntakeReqType(type);
  // Repairs and deliveries can optionally be tied to a contract too (so on-site damage found during
  // a viðgerð rebills to the right lease, and afhending shows which lease the unit is going out
  // under), but unlike intake it's not required — a lot of this work happens without one on hand.
  const showContractPicker = isIntake || type === "vidgerd" || type === "afhending";
  // A contract must cover every selected unit — e.g. a whole vinnubúðir camp (several units) is
  // normally one lease, so "which contract" only makes sense once it matches the full selection.
  const unitContracts = useMemo(
    () => contracts.filter((c) => unitIds.length > 0 && unitIds.every((id) => c.unitIds.includes(id))),
    [contracts, unitIds],
  );
  const toggleUnit = (id: string) => {
    setUnitIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
    setContractId("");
  };
  const filteredUnits = useMemo(
    () => units.filter((u) => !unitQuery || norm(`${u.code} ${u.location}`).includes(norm(unitQuery))),
    [units, unitQuery],
  );

  const submit = async () => {
    if (!title.trim()) {
      setError("Titill vantar.");
      return;
    }
    if (isIntake && !unitIds.length) {
      setError("Veldu að minnsta kosti eina einingu sem verkið á við.");
      return;
    }
    if (isIntake && !contractId) {
      setError(unitContracts.length ? "Veldu leigusamning eininganna — svo skemmdir rekist á réttan samning." : "Enginn leigusamningur fannst sem nær yfir allar valdar einingar — athugaðu hvort þær séu réttar.");
      return;
    }
    setError(null);
    try {
      const created = await create.mutateAsync({
        title: title.trim(),
        type,
        unitIds,
        contractId: showContractPicker && contractId ? contractId : null,
        priority,
        description: description.trim() || null,
        assignedTo: null,
        dueDate: todayIso(),
      });
      nav(`/verk/${created.id}`);
    } catch (e) {
      setError("Ekki tókst að stofna verk: " + (e as Error).message);
    }
  };

  return (
    <section style={{ display: "flex", flexDirection: "column", minHeight: 844, paddingBottom: 110 }}>
      <header style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--color-bg)", borderBottom: "1px solid var(--color-divider)", padding: "16px 18px 12px" }}>
        <button className="btn btn-ghost" onClick={() => nav("/")} style={{ padding: 0, marginBottom: 8 }}>
          ← Verk dagsins
        </button>
        <h1 style={{ fontSize: 26, margin: 0, lineHeight: 1.1 }}>Nýtt verk</h1>
      </header>

      <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="field" style={{ margin: 0 }}>
          <label>Titill</label>
          <input className="input" style={{ minHeight: 46 }} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={isIntake ? "t.d. Óvænt skil — ST-105" : "t.d. Samsetning ST-118 á lager"} />
        </div>

        <div className="field" style={{ margin: 0 }}>
          <label>Tegund verks</label>
          <select
            className="input"
            style={{ minHeight: 46 }}
            value={type}
            onChange={(e) => {
              setType(e.target.value as ReqType);
              setContractId("");
            }}
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{REQ_TYPE[t]}</option>
            ))}
          </select>
          {type === "mottaka" ? (
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 5 }}>Móttaka fer í gegnum skilyrta 4-þrepa ferlið (móttaka → ástandsmat → standsetning → tilbúin).</div>
          ) : type === "standsetning" ? (
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 5 }}>Standsetning sleppir móttökuskrefinu — eining er þegar komin, ferlið fer beint í ástandsmat → standsetningu → tilbúin.</div>
          ) : null}
        </div>

        <div className="field" style={{ margin: 0 }}>
          <label>{type === "mottaka" ? "Einingar sem eru að skila sér" : isIntake ? "Einingar sem á að vinna" : "Einingar (valfrjálst)"}</label>
          {unitIds.length ? (
            <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 6 }}>{unitIds.length} valdar — t.d. heilar vinnubúðir sem innihalda margar einingar.</div>
          ) : null}
          <input
            className="input"
            style={{ minHeight: 42, marginBottom: 6 }}
            value={unitQuery}
            onChange={(e) => setUnitQuery(e.target.value)}
            placeholder="Leita eftir einingakóða eða staðsetningu…"
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 260, overflowY: "auto", border: "1px solid var(--color-divider)", padding: 6 }}>
            {filteredUnits.length === 0 ? (
              <div style={{ padding: "10px 6px", fontSize: 13, opacity: 0.6 }}>Engin eining fannst.</div>
            ) : null}
            {filteredUnits.map((u) => {
              const checked = unitIds.includes(u.id);
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleUnit(u.id)}
                  style={{ display: "flex", gap: 11, alignItems: "center", width: "100%", minHeight: 44, padding: "8px 10px", border: `1px solid ${checked ? "var(--color-accent)" : "var(--color-divider)"}`, background: checked ? "var(--color-accent-100)" : "none", cursor: "pointer", font: "inherit", color: "var(--color-text)", textAlign: "left" }}
                >
                  <span style={{ width: 20, height: 20, flex: "none", display: "grid", placeItems: "center", border: `1px solid ${checked ? "var(--color-accent)" : "var(--color-neutral-400)"}`, background: checked ? "var(--color-accent)" : "none", color: "var(--color-bg)", fontSize: 13 }}>
                    {checked ? "✓" : ""}
                  </span>
                  <span style={{ fontSize: 13.5 }}>{u.code}{u.sizeM2 ? ` · ${u.sizeM2} m²` : ""} · {u.location}</span>
                </button>
              );
            })}
          </div>
        </div>

        {showContractPicker ? (
          <div className="field" style={{ margin: 0 }}>
            <label>Leigusamningur{isIntake ? "" : " (valfrjálst)"}</label>
            <select className="input" style={{ minHeight: 46 }} value={contractId} onChange={(e) => setContractId(e.target.value)} disabled={!unitIds.length}>
              <option value="">{unitIds.length ? "— Veldu samning —" : "— Veldu einingu fyrst —"}</option>
              {unitContracts.map((c) => (
                <option key={c.id} value={c.id}>{c.number}</option>
              ))}
            </select>
            {isIntake && unitIds.length && !unitContracts.length ? (
              <div style={{ fontSize: 12, color: "#8a6321", marginTop: 5 }}>Enginn samningur nær yfir allar valdar einingar.</div>
            ) : null}
          </div>
        ) : null}

        <div className="field" style={{ margin: 0 }}>
          <label>Forgangur</label>
          <select className="input" style={{ minHeight: 46 }} value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>{PRIORITY[p]}</option>
            ))}
          </select>
        </div>

        <div className="field" style={{ margin: 0 }}>
          <label>Lýsing (valfrjálst)</label>
          <textarea className="input" style={{ minHeight: 90 }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Nánari lýsing á verkinu…" />
        </div>

        {error ? <div style={{ fontSize: 13, color: "#8f4038" }}>{error}</div> : null}
      </div>

      <div style={{ position: "fixed", bottom: 0, width: 390, background: "var(--color-bg)", borderTop: "1.5px solid var(--color-neutral-400)", padding: "13px 18px 18px" }}>
        <button className="btn btn-primary" onClick={submit} disabled={create.isPending} style={{ minHeight: 52, fontSize: 16, width: "100%" }}>
          {create.isPending ? "Stofna…" : "Stofna verk"}
        </button>
      </div>
    </section>
  );
}
