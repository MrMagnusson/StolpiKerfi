// Ported from the detailPanels construction in renderVals() (Stólpi Kerfi.dc.html lines 1740-1805) —
// right-column context panels per entity kind.
import {
  buildMatch, short, DAMAGE_CAUSE, DAMAGE_STATUS, MAINT_TYPE, REQ_STATUS, REQ_TYPE, UNIT_STATUS,
  DEAL_STAGES, STAGE_PROB, ACTIVITY_TYPE, ROLES, ROLE_MATRIX, PERMS, weightedDealValue,
  type Unit, type Project, type Damage, type MaintenanceEntry, type ServiceRequest, type Doc,
  type Contract, type Deal, type Activity, type Role, type DealStage,
} from "@stolpi/shared";

export interface PanelRow {
  label: string;
  note: string;
  value: string;
  /** When set, the row navigates to this route on click (e.g. the damage's/request's own detail page). */
  to?: string;
}
export interface Panel {
  title: string;
  hint: string;
  rows: PanelRow[];
  isEmpty: boolean;
  emptyText: string;
}

export interface PanelData {
  units: Unit[];
  projects: Project[];
  damages: Damage[];
  maintenance: MaintenanceEntry[];
  requests: ServiceRequest[];
  docs: Doc[];
  contracts: Contract[];
  deals: Deal[];
  activities: Activity[];
  contacts: { id: string; name: string; title: string | null; phone: string | null; customerId: string | null }[];
}

export function buildPanels(kind: string, draft: any, d: PanelData): Panel[] {
  const panels: Panel[] = [];
  if (!draft?.id) return panels;

  if (kind === "units") {
    const dmg = d.damages.filter((x) => x.unitId === draft.id).sort((a, b) => (a.date < b.date ? 1 : -1));
    const hist = d.maintenance.filter((m) => m.unitId === draft.id).sort((a, b) => (a.date < b.date ? 1 : -1));
    panels.push({
      title: "Ástandsskrá — skemmdir",
      hint: dmg.length ? `Tjónakostnaður ${short(dmg.reduce((s, x) => s + (x.costIsk || 0), 0))}` : "",
      rows: dmg.map((x) => {
        const contractNo = d.contracts.find((c) => c.id === x.contractId)?.number;
        return {
          label: x.description,
          note: `${x.date} · ${DAMAGE_CAUSE[x.cause]}: ${x.responsible || "—"} · ${DAMAGE_STATUS[x.status].label}${x.rebilled ? " · endurkrafið" : " · á Stólpa"}${contractNo ? ` · ${contractNo}` : ""}${x.photos?.length ? ` · ${x.photos.length} mynd${x.photos.length === 1 ? "" : "ir"}` : ""}`,
          value: short(x.costIsk),
          to: `/detail/damages/${x.id}`,
        };
      }),
      isEmpty: !dmg.length,
      emptyText: "Engin skemmd skráð á þessa einingu.",
    });
    panels.push({
      title: "Viðhaldssaga",
      hint: hist.length ? `Samtals ${short(hist.reduce((s, m) => s + (m.costIsk || 0), 0))}` : "",
      rows: hist.map((m) => ({ label: `${MAINT_TYPE[m.type]} — ${m.note ?? ""}`, note: `${m.date} · ${m.by ?? "—"}`, value: m.costIsk ? short(m.costIsk) : "—" })),
      isEmpty: !hist.length,
      emptyText: "Engin viðhaldsfærsla skráð á þessa einingu.",
    });
    const reqs = d.requests.filter((r) => r.unitId === draft.id);
    panels.push({
      title: "Beiðnir",
      hint: "",
      rows: reqs.map((r) => ({
        label: r.title,
        note: `${REQ_TYPE[r.type]} · ${r.assignedTo ?? "—"}${r.photos?.length ? ` · ${r.photos.length} mynd${r.photos.length === 1 ? "" : "ir"}` : ""}`,
        value: REQ_STATUS[r.status].label,
        to: `/detail/requests/${r.id}`,
      })),
      isEmpty: !reqs.length,
      emptyText: "Engar beiðnir tengdar einingunni.",
    });
    const docs = d.docs.filter((x) => x.ref === draft.id);
    panels.push({
      title: "Skjöl & myndir",
      hint: `${docs.length} skjöl`,
      rows: docs.map((x) => ({ label: x.name, note: `${x.kind} · ${x.date}`, value: x.size })),
      isEmpty: true,
      emptyText: "Dragðu skjöl eða myndir hingað til að hlaða upp",
    });
  }

  if (kind === "projects") {
    const mm = buildMatch(draft, d.units);
    panels.push({
      title: "Pörun",
      hint: `${mm.eligible.length} / ${draft.unitsNeeded || 0}`,
      rows: mm.eligible.slice(0, 5).map((x) => ({ label: x.unit.code, note: `${x.unit.sizeM2} m² · ${x.unit.location}`, value: `${x.percent}%` })),
      isEmpty: !mm.eligible.length,
      emptyText: "Engin laus eining uppfyllir kröfurnar.",
    });
    const cs = d.contracts.filter((c) => c.projectId === draft.id);
    panels.push({
      title: "Samningar",
      hint: "",
      rows: cs.map((c) => ({ label: c.number, note: `${c.startDate ?? "—"} → ${c.endDate ?? "—"}`, value: short(c.monthlyIsk) })),
      isEmpty: !cs.length,
      emptyText: "Enginn samningur tengdur verkefninu.",
    });
  }

  if (kind === "customers") {
    const deals = d.deals.filter((x) => x.customerId === draft.id);
    panels.push({ title: "Tækifæri", hint: "", rows: deals.map((x) => ({ label: x.title, note: `${DEAL_STAGES[x.stage]} · ${x.owner}`, value: short(x.valueIsk) })), isEmpty: !deals.length, emptyText: "Engin tækifæri skráð." });
    const cs = d.contracts.filter((c) => c.customerId === draft.id);
    panels.push({ title: "Samningar", hint: "", rows: cs.map((c) => ({ label: c.number, note: `${c.startDate ?? "—"} → ${c.endDate ?? "—"}`, value: short(c.monthlyIsk) })), isEmpty: !cs.length, emptyText: "Enginn samningur skráður." });
    const conts = d.contacts.filter((c) => c.customerId === draft.id);
    panels.push({ title: "Tengiliðir", hint: "", rows: conts.map((c) => ({ label: c.name, note: c.title || "", value: c.phone || "—" })), isEmpty: !conts.length, emptyText: "Enginn tengiliður skráður." });
  }

  if (kind === "contracts") {
    const unitIds: string[] = draft.unitIds || [];
    panels.push({
      title: "Einingar á samningi",
      hint: "",
      rows: unitIds.map((id) => {
        const u = d.units.find((x) => x.id === id);
        return { label: u?.code ?? "—", note: `${u?.sizeM2 ?? "?"} m² · ${u?.location ?? ""}`, value: u ? UNIT_STATUS[u.status].label : "—" };
      }),
      isEmpty: !unitIds.length,
      emptyText: "Engin eining tengd samningnum enn.",
    });
    panels.push({
      title: "Fjárhagur",
      hint: "",
      rows: [
        { label: "Mánaðarverð", note: "grunnverð skv. samningi", value: short(draft.monthlyIsk) },
        { label: "Áætlað heildarvirði", note: "út gildistíma", value: short((draft.monthlyIsk || 0) * 6) },
      ],
      isEmpty: false,
      emptyText: "",
    });
    panels.push({ title: "Skjöl", hint: "", rows: [], isEmpty: true, emptyText: "Dragðu undirritaðan samning hingað (PDF)" });

    const relReqs = d.requests.filter((r) => r.contractId === draft.id);
    const relDamages = d.damages.filter((x) => x.contractId === draft.id);
    panels.push({
      title: "Móttökur og skemmdir",
      hint: relDamages.length ? `Tjónakostnaður ${short(relDamages.reduce((s, x) => s + (x.costIsk || 0), 0))}` : "",
      rows: [
        ...relReqs.map((r) => ({
          label: r.title,
          note: `${REQ_TYPE[r.type]} · ${REQ_STATUS[r.status].label}${r.photos?.length ? ` · ${r.photos.length} mynd${r.photos.length === 1 ? "" : "ir"}` : ""}`,
          value: r.dueDate ?? "—",
          to: `/detail/requests/${r.id}`,
        })),
        ...relDamages.map((x) => ({
          label: x.description,
          note: `${x.date} · ${DAMAGE_CAUSE[x.cause]}${x.photos?.length ? ` · ${x.photos.length} mynd${x.photos.length === 1 ? "" : "ir"}` : ""}`,
          value: short(x.costIsk),
          to: `/detail/damages/${x.id}`,
        })),
      ],
      isEmpty: !relReqs.length && !relDamages.length,
      emptyText: "Engar móttökur eða skemmdir skráðar á þennan samning.",
    });
  }

  if (kind === "deals") {
    panels.push({
      title: "Sölugreining",
      hint: "",
      rows: [
        { label: "Vegið virði", note: `${STAGE_PROB[draft.stage as DealStage]}% líkur á stigi`, value: short(weightedDealValue(draft.valueIsk, draft.stage)) },
        { label: "Næsta skref", note: draft.nextStep || "—", value: draft.expectedClose || "—" },
      ],
      isEmpty: false,
      emptyText: "",
    });
    const acts = d.activities.filter((a) => a.customerId === draft.customerId);
    panels.push({ title: "Samskipti", hint: "", rows: acts.map((a) => ({ label: a.subject, note: ACTIVITY_TYPE[a.type], value: a.dueDate || "—" })), isEmpty: !acts.length, emptyText: "Engin samskipti skráð." });
  }

  if (kind === "users") {
    const perms = ROLE_MATRIX[draft.role as Role] || [];
    panels.push({
      title: "Réttindi hlutverks",
      hint: ROLES[draft.role as Role] || "",
      rows: PERMS.map((p, i) => ({ label: p, note: "", value: perms[i] === 2 ? "Full réttindi" : perms[i] === 1 ? "Lesa" : "Enginn aðgangur" })),
      isEmpty: false,
      emptyText: "",
    });
  }

  if (kind === "requests") {
    const u = d.units.find((x) => x.id === draft.unitId);
    const contractNo = d.contracts.find((c) => c.id === draft.contractId)?.number;
    panels.push({
      title: "Tengd eining",
      hint: "",
      rows: u ? [{ label: u.code, note: `${u.sizeM2} m² · ${u.location}${contractNo ? ` · ${contractNo}` : ""}`, value: UNIT_STATUS[u.status].label }] : [],
      isEmpty: !u,
      emptyText: "Engin eining valin.",
    });
    const docs = d.docs.filter((x) => x.ref === draft.unitId);
    panels.push({ title: "Skjöl & myndir", hint: "", rows: docs.map((x) => ({ label: x.name, note: `${x.kind} · ${x.date}`, value: x.size })), isEmpty: true, emptyText: "Dragðu myndir af vinnunni hingað" });
  }

  return panels;
}
