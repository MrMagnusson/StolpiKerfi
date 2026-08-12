import type {
  ActivityType, ContractStatus, DamageCause, DamageStatus, DealStage,
  InvoiceStatus, MaintType, Priority, ProjectStatus, QuoteStatus,
  ReqStatus, ReqType, Role, UnitStatus,
} from "./enums.js";

export interface Unit {
  id: string;
  code: string;
  sizeM2: number;
  hasToilet: boolean;
  status: UnitStatus;
  location: string;
  equipment: string[];
  customerId: string | null;
}

export interface Project {
  id: string;
  name: string;
  customerId: string | null;
  unitsNeeded: number;
  needsToilet: boolean;
  minSizeM2: number | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  status: ProjectStatus;
  requiredEquipment: string[];
}

export interface Customer {
  id: string;
  name: string;
  kennitala: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
}

export interface Contact {
  id: string;
  customerId: string | null;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
}

export interface Deal {
  id: string;
  title: string;
  customerId: string | null;
  contactId: string | null;
  stage: DealStage;
  valueIsk: number;
  source: string | null;
  expectedClose: string | null;
  owner: string;
  nextStep: string | null;
  notes: string | null;
}

export interface Activity {
  id: string;
  type: ActivityType;
  subject: string;
  customerId: string | null;
  contactId: string | null;
  dueDate: string | null;
  done: boolean;
  notes: string | null;
}

export interface SalesTarget {
  id: string;
  owner: string;
  year: number;
  month: number;
  targetIsk: number;
}

export interface ServiceRequest {
  id: string;
  title: string;
  type: ReqType;
  unitId: string | null;
  projectId: string | null;
  status: ReqStatus;
  priority: Priority;
  description: string | null;
  assignedTo: string | null;
  dueDate: string | null;
}

export interface Contract {
  id: string;
  number: string;
  customerId: string | null;
  projectId: string | null;
  unitIds: string[];
  startDate: string | null;
  endDate: string | null;
  monthlyIsk: number;
  status: ContractStatus;
  notes: string | null;
}

export interface Quote {
  id: string;
  number: string;
  customerId: string | null;
  projectId: string | null;
  totalIsk: number;
  validTo: string | null;
  status: QuoteStatus;
  notes: string | null;
}

export interface PriceItem {
  id: string;
  name: string;
  monthlyIsk: number;
  deliveryIsk: number;
  minMonths: number;
  note: string | null;
}

export interface Invoice {
  id: string;
  number: string;
  customerId: string | null;
  contractNumber: string | null;
  period: string;
  units: number;
  amountIsk: number;
  status: InvoiceStatus;
  bcRef: string | null;
}

export interface Damage {
  id: string;
  unitId: string;
  date: string;
  description: string;
  cause: DamageCause;
  responsible: string | null;
  projectId: string | null;
  costIsk: number;
  rebilled: boolean;
  status: DamageStatus;
}

export interface MaintenanceEntry {
  id: string;
  unitId: string;
  date: string;
  type: MaintType;
  note: string | null;
  costIsk: number;
  by: string | null;
}

export interface Doc {
  id: string;
  ref: string;
  name: string;
  kind: string;
  size: string;
  date: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  lastLogin: string | null;
}

export interface BcSettings {
  connected: boolean;
  environment: string;
  company: string;
  tenant: string;
  schedule: string;
  autopost: boolean;
}

export interface BcLogEntry {
  id: string;
  title: string;
  time: string;
  status: string;
  tone: string;
}

// --- computed shapes ---

export interface MatchReason {
  ok: boolean;
  text: string;
}

export interface UnitScore {
  unit: Unit;
  eligible: boolean;
  score: number;
  percent: number;
  reasons: MatchReason[];
}

export interface MatchResult {
  eligible: UnitScore[];
  notEligible: UnitScore[];
}
