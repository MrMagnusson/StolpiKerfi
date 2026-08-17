// Status/label/tone maps — ported verbatim from the Industry design prototype
// (Stólpi Kerfi.dc.html, Component class fields around lines 939-973).

export type Tone = "ok" | "warn" | "bad" | "info" | "steel" | "neutral";

export const TONES: Record<Tone, { fg: string; bg: string }> = {
  ok: { fg: "#3f6b4d", bg: "#dfe9e1" },
  warn: { fg: "#8a6321", bg: "#f0e6d3" },
  bad: { fg: "#8f4038", bg: "#f0dedb" },
  info: { fg: "#2c455d", bg: "#d6ebff" },
  steel: { fg: "#1d2d3d", bg: "#b5d9fd" },
  neutral: { fg: "#5d5d60", bg: "#e7e7ea" },
};

export type UnitStatus = "available" | "reserved" | "in_use" | "returned" | "damaged";
export const UNIT_STATUS: Record<UnitStatus, { label: string; tone: Tone }> = {
  available: { label: "Tilbúin til leigu", tone: "ok" },
  reserved: { label: "Frátekin", tone: "info" },
  in_use: { label: "Í leigu", tone: "steel" },
  returned: { label: "Komin til baka", tone: "warn" },
  damaged: { label: "Skemmd", tone: "bad" },
};

export type DealStage = "nytt" | "i_samskiptum" | "tilbod_sent" | "samningar" | "unnid" | "tapad";
export const DEAL_STAGES: Record<DealStage, string> = {
  nytt: "Nýtt",
  i_samskiptum: "Í samskiptum",
  tilbod_sent: "Tilboð sent",
  samningar: "Samningar",
  unnid: "Unnið",
  tapad: "Tapað",
};
export const STAGE_PROB: Record<DealStage, number> = {
  nytt: 10,
  i_samskiptum: 25,
  tilbod_sent: 50,
  samningar: 75,
  unnid: 100,
  tapad: 0,
};

export type ActivityType = "simtal" | "tolvupostur" | "fundur" | "verkefni";
export const ACTIVITY_TYPE: Record<ActivityType, string> = {
  simtal: "Símtal",
  tolvupostur: "Tölvupóstur",
  fundur: "Fundur",
  verkefni: "Verkefni",
};

export type ReqStatus = "ny" | "i_vinnslu" | "tilbuin" | "lokid" | "hafnad";
export const REQ_STATUS: Record<ReqStatus, { label: string; tone: Tone }> = {
  ny: { label: "Ný", tone: "warn" },
  i_vinnslu: { label: "Í vinnslu", tone: "info" },
  tilbuin: { label: "Tilbúin", tone: "ok" },
  lokid: { label: "Lokið", tone: "neutral" },
  hafnad: { label: "Hafnað", tone: "bad" },
};

export type ReqType = "standsetning" | "vidgerd" | "flutningur" | "samsetning" | "uppsetning" | "annad";
export const REQ_TYPE: Record<ReqType, string> = {
  standsetning: "Standsetning",
  vidgerd: "Viðgerð",
  flutningur: "Flutningur",
  samsetning: "Samsetning nýrrar einingar",
  uppsetning: "Uppsetning á verkstað",
  annad: "Annað",
};

/** Only "standsetning" (unit intake/return) uses the gated 4-step Vettvangur flow — every other
 * type (assembly, on-site setup, repairs, transport, other) uses the simple one-step flow. */
export function isIntakeReqType(type: string): boolean {
  return type === "standsetning";
}

export type Priority = "lag" | "medal" | "ha";
export const PRIORITY: Record<Priority, string> = { lag: "Lág", medal: "Meðal", ha: "Há" };

export type ProjectStatus = "planning" | "active" | "completed" | "cancelled";
export const PROJ_STATUS: Record<ProjectStatus, string> = {
  planning: "Í undirbúningi",
  active: "Virkt",
  completed: "Lokið",
  cancelled: "Hætt við",
};

export type ContractStatus = "drog" | "virkur" | "rennur_ut" | "lokid";
export const CONTRACT_STATUS: Record<ContractStatus, { label: string; tone: Tone }> = {
  drog: { label: "Drög", tone: "neutral" },
  virkur: { label: "Virkur", tone: "ok" },
  rennur_ut: { label: "Rennur út", tone: "warn" },
  lokid: { label: "Lokið", tone: "neutral" },
};

export type QuoteStatus = "drog" | "sent" | "samthykkt" | "hafnad";
export const QUOTE_STATUS: Record<QuoteStatus, { label: string; tone: Tone }> = {
  drog: { label: "Drög", tone: "neutral" },
  sent: { label: "Sent", tone: "info" },
  samthykkt: { label: "Samþykkt", tone: "ok" },
  hafnad: { label: "Hafnað", tone: "bad" },
};

export type MaintType = "thrif" | "vidgerd" | "skodun" | "uppfaersla" | "samsetning" | "uppsetning" | "flutningur" | "annad";
export const MAINT_TYPE: Record<MaintType, string> = {
  thrif: "Þrif",
  vidgerd: "Viðgerð",
  skodun: "Skoðun",
  uppfaersla: "Uppfærsla",
  samsetning: "Samsetning nýrrar einingar",
  uppsetning: "Uppsetning á verkstað",
  flutningur: "Flutningur",
  annad: "Annað",
};

export type Role = "admin" | "sala" | "thjonusta" | "lager" | "lesandi";
export const ROLES: Record<Role, string> = {
  admin: "Kerfisstjóri",
  sala: "Sala",
  thjonusta: "Þjónusta",
  lager: "Lager",
  lesandi: "Lesandi",
};
export const PERMS = ["Einingar", "Verkefni", "Sala", "Samningar", "Verðskrá", "Beiðnir", "Notendur"] as const;
// 2 = full access, 1 = read-only, 0 = no access
export const ROLE_MATRIX: Record<Role, number[]> = {
  admin: [2, 2, 2, 2, 2, 2, 2],
  sala: [1, 2, 2, 2, 2, 1, 0],
  thjonusta: [2, 1, 0, 0, 0, 2, 0],
  lager: [2, 1, 0, 1, 0, 2, 0],
  lesandi: [1, 1, 1, 1, 1, 1, 0],
};

export type DamageCause = "vidskiptavinur" | "starfsmadur" | "flutningur" | "vedur" | "othekkt";
export const DAMAGE_CAUSE: Record<DamageCause, string> = {
  vidskiptavinur: "Viðskiptavinur",
  starfsmadur: "Starfsmaður Stólpa",
  flutningur: "Flutningsaðili",
  vedur: "Veður / óviðráðanlegt",
  othekkt: "Óþekkt",
};

export type DamageStatus = "skrad" | "i_vidgerd" | "lagfaert" | "afskrifad";
export const DAMAGE_STATUS: Record<DamageStatus, { label: string; tone: Tone }> = {
  skrad: { label: "Skráð", tone: "warn" },
  i_vidgerd: { label: "Í viðgerð", tone: "info" },
  lagfaert: { label: "Lagfært", tone: "ok" },
  afskrifad: { label: "Afskrifað", tone: "neutral" },
};

export type InvoiceStatus = "drog" | "tilbuinn" | "sendur" | "greiddur";
export const INVOICE_STATUS: Record<InvoiceStatus, { label: string; tone: Tone }> = {
  drog: { label: "Drög", tone: "neutral" },
  tilbuinn: { label: "Tilbúinn", tone: "info" },
  sendur: { label: "Sendur í BC", tone: "ok" },
  greiddur: { label: "Greiddur", tone: "ok" },
};

export const EQUIPMENT = [
  "Klósett", "Sturta", "Eldhúskrókur", "Hitablásari", "Loftkæling",
  "Rafmagnstafla", "Innréttingar", "Öryggisdyr", "Gluggar", "Ísskápur",
  "Skrifborð", "Nettenging",
] as const;

export const DEAL_SOURCES = ["Tilvísun", "Útboð", "Heimasíða", "Kaldur póstur", "Endurtekið", "Annað"] as const;
export const SALESPEOPLE = ["Kalli", "Gummi Gunnar", "Fannar", "Kristján", "Pálmi"] as const;
export const MONTHS = [
  "Janúar", "Febrúar", "Mars", "Apríl", "Maí", "Júní",
  "Júlí", "Ágúst", "September", "Október", "Nóvember", "Desember",
] as const;
