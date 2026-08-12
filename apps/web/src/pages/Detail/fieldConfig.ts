// Ported from fieldConfig() in Stólpi Kerfi.dc.html (lines 1232-1360) — field list + input type per
// entity kind, reused by the generic detail-page form for all 13 record types.
import {
  ACTIVITY_TYPE, CONTRACT_STATUS, DAMAGE_CAUSE, DAMAGE_STATUS, DEAL_SOURCES, DEAL_STAGES,
  EQUIPMENT, INVOICE_STATUS, PRIORITY, PROJ_STATUS, QUOTE_STATUS, REQ_STATUS, REQ_TYPE,
  ROLES, SALESPEOPLE, STAGE_PROB, UNIT_STATUS,
} from "@stolpi/shared";

export type FieldType = "text" | "number" | "date" | "select" | "toggle" | "textarea" | "chips";

export interface SelectOpt {
  value: string;
  label: string;
}

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: SelectOpt[];
}

const entOpts = (o: Record<string, string>): SelectOpt[] => Object.keys(o).map((k) => ({ value: k, label: o[k] }));
const toneEntOpts = (o: Record<string, { label: string }>): SelectOpt[] => Object.keys(o).map((k) => ({ value: k, label: o[k].label }));

export interface RefLists {
  customers: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  units: { id: string; code: string }[];
  contacts: { id: string; name: string }[];
}

export function fieldConfig(kind: string, refs: RefLists): FieldDef[] {
  const cust: SelectOpt[] = refs.customers.map((c) => ({ value: c.id, label: c.name }));
  const proj: SelectOpt[] = refs.projects.map((p) => ({ value: p.id, label: p.name }));
  const unit: SelectOpt[] = refs.units.map((u) => ({ value: u.id, label: u.code }));
  const cont: SelectOpt[] = refs.contacts.map((c) => ({ value: c.id, label: c.name }));

  const table: Record<string, FieldDef[]> = {
    units: [
      { key: "code", label: "Kóði", type: "text" },
      { key: "sizeM2", label: "Stærð (m²)", type: "number" },
      { key: "status", label: "Staða", type: "select", options: toneEntOpts(UNIT_STATUS) },
      { key: "location", label: "Staðsetning", type: "text" },
      { key: "hasToilet", label: "Klósett", type: "toggle" },
      { key: "equipment", label: "Búnaður", type: "chips", options: EQUIPMENT.map((e) => ({ value: e, label: e })) },
    ],
    projects: [
      { key: "name", label: "Heiti verkefnis", type: "text" },
      { key: "customerId", label: "Viðskiptavinur", type: "select", options: cust },
      { key: "unitsNeeded", label: "Fjöldi eininga", type: "number" },
      { key: "minSizeM2", label: "Lágmarksstærð (m²)", type: "number" },
      { key: "needsToilet", label: "Þarf klósett", type: "toggle" },
      { key: "requiredEquipment", label: "Búnaðarkröfur", type: "chips", options: EQUIPMENT.map((e) => ({ value: e, label: e })) },
      { key: "location", label: "Staðsetning", type: "text" },
      { key: "startDate", label: "Frá", type: "date" },
      { key: "endDate", label: "Til", type: "date" },
      { key: "status", label: "Staða", type: "select", options: entOpts(PROJ_STATUS) },
    ],
    customers: [
      { key: "name", label: "Nafn fyrirtækis", type: "text" },
      { key: "kennitala", label: "Kennitala", type: "text" },
      { key: "phone", label: "Sími", type: "text" },
      { key: "email", label: "Netfang", type: "text" },
      { key: "address", label: "Heimilisfang", type: "text" },
      { key: "notes", label: "Athugasemdir", type: "textarea" },
    ],
    contacts: [
      { key: "name", label: "Nafn", type: "text" },
      { key: "customerId", label: "Fyrirtæki", type: "select", options: cust },
      { key: "title", label: "Titill", type: "text" },
      { key: "email", label: "Netfang", type: "text" },
      { key: "phone", label: "Sími", type: "text" },
    ],
    deals: [
      { key: "title", label: "Heiti tækifæris", type: "text" },
      { key: "customerId", label: "Fyrirtæki", type: "select", options: cust },
      { key: "contactId", label: "Tengiliður", type: "select", options: cont },
      { key: "stage", label: "Stig", type: "select", options: Object.keys(DEAL_STAGES).map((k) => ({ value: k, label: `${DEAL_STAGES[k as keyof typeof DEAL_STAGES]} (${STAGE_PROB[k as keyof typeof STAGE_PROB]}%)` })) },
      { key: "valueIsk", label: "Virði (ISK)", type: "number" },
      { key: "source", label: "Uppruni", type: "select", options: DEAL_SOURCES.map((s) => ({ value: s, label: s })) },
      { key: "expectedClose", label: "Áætluð lokun", type: "date" },
      { key: "owner", label: "Sölumaður", type: "select", options: SALESPEOPLE.map((s) => ({ value: s, label: s })) },
      { key: "nextStep", label: "Næsta skref", type: "text" },
      { key: "notes", label: "Athugasemdir", type: "textarea" },
    ],
    activities: [
      { key: "subject", label: "Efni", type: "text" },
      { key: "type", label: "Tegund", type: "select", options: entOpts(ACTIVITY_TYPE) },
      { key: "customerId", label: "Fyrirtæki", type: "select", options: cust },
      { key: "contactId", label: "Tengiliður", type: "select", options: cont },
      { key: "dueDate", label: "Gjalddagi", type: "date" },
      { key: "done", label: "Lokið", type: "toggle" },
      { key: "notes", label: "Athugasemdir", type: "textarea" },
    ],
    requests: [
      { key: "title", label: "Heiti beiðni", type: "text" },
      { key: "type", label: "Tegund", type: "select", options: entOpts(REQ_TYPE) },
      { key: "unitId", label: "Eining", type: "select", options: unit },
      { key: "projectId", label: "Verkefni", type: "select", options: proj },
      { key: "priority", label: "Forgangur", type: "select", options: entOpts(PRIORITY) },
      { key: "status", label: "Staða", type: "select", options: toneEntOpts(REQ_STATUS) },
      { key: "assignedTo", label: "Ábyrgð", type: "text" },
      { key: "dueDate", label: "Skiladagur", type: "date" },
      { key: "description", label: "Lýsing", type: "textarea" },
    ],
    contracts: [
      { key: "number", label: "Samningsnúmer", type: "text" },
      { key: "customerId", label: "Viðskiptavinur", type: "select", options: cust },
      { key: "projectId", label: "Verkefni", type: "select", options: proj },
      { key: "startDate", label: "Gildir frá", type: "date" },
      { key: "endDate", label: "Gildir til", type: "date" },
      { key: "monthlyIsk", label: "Mánaðarverð (ISK)", type: "number" },
      { key: "status", label: "Staða", type: "select", options: toneEntOpts(CONTRACT_STATUS) },
      { key: "notes", label: "Skilmálar og athugasemdir", type: "textarea" },
    ],
    quotes: [
      { key: "number", label: "Tilboðsnúmer", type: "text" },
      { key: "customerId", label: "Viðskiptavinur", type: "select", options: cust },
      { key: "projectId", label: "Verkefni", type: "select", options: proj },
      { key: "totalIsk", label: "Heildarverð (ISK)", type: "number" },
      { key: "validTo", label: "Gildir til", type: "date" },
      { key: "status", label: "Staða", type: "select", options: toneEntOpts(QUOTE_STATUS) },
      { key: "notes", label: "Athugasemdir", type: "textarea" },
    ],
    pricing: [
      { key: "name", label: "Flokkur", type: "text" },
      { key: "monthlyIsk", label: "Mánaðarleiga (ISK)", type: "number" },
      { key: "deliveryIsk", label: "Afhendingargjald (ISK)", type: "number" },
      { key: "minMonths", label: "Lágmarkstími (mán.)", type: "number" },
      { key: "note", label: "Innifalið", type: "text" },
    ],
    damages: [
      { key: "description", label: "Lýsing á skemmd", type: "text" },
      { key: "unitId", label: "Eining", type: "select", options: unit },
      { key: "date", label: "Dagsetning", type: "date" },
      { key: "cause", label: "Hver olli", type: "select", options: entOpts(DAMAGE_CAUSE) },
      { key: "responsible", label: "Ábyrgðaraðili (nafn)", type: "text" },
      { key: "projectId", label: "Verkefni", type: "select", options: proj },
      { key: "costIsk", label: "Kostnaður (ISK)", type: "number" },
      { key: "rebilled", label: "Endurkrafið á viðskiptavin", type: "toggle" },
      { key: "status", label: "Staða", type: "select", options: toneEntOpts(DAMAGE_STATUS) },
    ],
    invoices: [
      { key: "number", label: "Reikningsnúmer", type: "text" },
      { key: "customerId", label: "Viðskiptavinur", type: "select", options: cust },
      { key: "contractNumber", label: "Samningur", type: "text" },
      { key: "period", label: "Tímabil", type: "text" },
      { key: "units", label: "Fjöldi eininga", type: "number" },
      { key: "amountIsk", label: "Upphæð (ISK)", type: "number" },
      { key: "status", label: "Staða", type: "select", options: toneEntOpts(INVOICE_STATUS) },
      { key: "bcRef", label: "BC-tilvísun", type: "text" },
    ],
    users: [
      { key: "name", label: "Nafn", type: "text" },
      { key: "email", label: "Netfang", type: "text" },
      { key: "role", label: "Hlutverk", type: "select", options: entOpts(ROLES) },
      { key: "active", label: "Virkur aðgangur", type: "toggle" },
    ],
  };

  return table[kind] || [];
}

export const KIND_KICKER: Record<string, string> = {
  units: "Eining", projects: "Verkefni", customers: "Fyrirtæki", contacts: "Tengiliður",
  deals: "Sölutækifæri", activities: "Verk", requests: "Beiðni", contracts: "Leigusamningur",
  quotes: "Tilboð", pricing: "Verðflokkur", users: "Notandi", damages: "Skemmd", invoices: "Reikningur",
};

export const KIND_DEFAULTS: Record<string, Record<string, unknown>> = {
  units: { status: "available", hasToilet: false, equipment: [], location: "Lager RVK" },
  projects: { status: "planning", needsToilet: false, unitsNeeded: 1, requiredEquipment: [] },
  customers: {},
  contacts: {},
  deals: { stage: "nytt", owner: "Kalli", source: "Tilvísun" },
  activities: { type: "simtal", done: false },
  requests: { status: "ny", type: "standsetning", priority: "medal", assignedTo: "Þjónusta" },
  contracts: { status: "drog", unitIds: [] },
  quotes: { status: "drog" },
  pricing: { minMonths: 3 },
  damages: { cause: "vidskiptavinur", status: "skrad", rebilled: false, date: new Date().toISOString().slice(0, 10) },
  invoices: { status: "drog", period: "Yfirstandandi" },
  users: { role: "lesandi", active: true },
};
