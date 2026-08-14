import { z } from "zod";

// One zod schema per entity kind — all fields optional on the wire (partial updates from the
// detail-page form are common in the source design) except the identifying field, which is
// required. Enum-shaped fields are left as free strings here and checked against the shared
// enum maps by the frontend/detail-form config; Prisma's column defaults cover the rest.
export const SCHEMAS: Record<string, z.AnyZodObject> = {
  units: z.object({
    code: z.string().min(1),
    sizeM2: z.number().nonnegative(),
    hasToilet: z.boolean().optional(),
    status: z.string().optional(),
    location: z.string().min(1),
    equipment: z.array(z.string()).optional(),
    customerId: z.string().nullable().optional(),
    photoMottaka: z.string().nullable().optional(),
    photoStandsett: z.string().nullable().optional(),
    photoSkemmd: z.string().nullable().optional(),
    photoAstand: z.string().nullable().optional(),
  }).partial({ code: true, sizeM2: true, location: true }),

  projects: z.object({
    name: z.string().min(1),
    customerId: z.string().nullable().optional(),
    unitsNeeded: z.number().int().nonnegative().optional(),
    needsToilet: z.boolean().optional(),
    minSizeM2: z.number().nullable().optional(),
    location: z.string().nullable().optional(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    status: z.string().optional(),
    requiredEquipment: z.array(z.string()).optional(),
  }).partial({ name: true }),

  customers: z.object({
    name: z.string().min(1),
    kennitala: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
  }).partial({ name: true }),

  contacts: z.object({
    customerId: z.string().nullable().optional(),
    name: z.string().min(1),
    title: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
  }).partial({ name: true }),

  deals: z.object({
    title: z.string().min(1),
    customerId: z.string().nullable().optional(),
    contactId: z.string().nullable().optional(),
    stage: z.string().optional(),
    valueIsk: z.number().nonnegative().optional(),
    source: z.string().nullable().optional(),
    expectedClose: z.string().nullable().optional(),
    owner: z.string().min(1),
    nextStep: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
  }).partial({ title: true, owner: true }),

  activities: z.object({
    type: z.string().optional(),
    subject: z.string().min(1),
    customerId: z.string().nullable().optional(),
    contactId: z.string().nullable().optional(),
    dueDate: z.string().nullable().optional(),
    done: z.boolean().optional(),
    notes: z.string().nullable().optional(),
  }).partial({ subject: true }),

  targets: z.object({
    owner: z.string().min(1),
    year: z.number().int(),
    month: z.number().int().min(1).max(12),
    targetIsk: z.number().nonnegative(),
  }).partial({ owner: true, year: true, month: true, targetIsk: true }),

  requests: z.object({
    title: z.string().min(1),
    type: z.string().optional(),
    unitId: z.string().nullable().optional(),
    projectId: z.string().nullable().optional(),
    status: z.string().optional(),
    priority: z.string().optional(),
    description: z.string().nullable().optional(),
    assignedTo: z.string().nullable().optional(),
    dueDate: z.string().nullable().optional(),
  }).partial({ title: true }),

  contracts: z.object({
    number: z.string().min(1),
    customerId: z.string().nullable().optional(),
    projectId: z.string().nullable().optional(),
    unitIds: z.array(z.string()).optional(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    monthlyIsk: z.number().nonnegative().optional(),
    status: z.string().optional(),
    notes: z.string().nullable().optional(),
  }).partial({ number: true }),

  quotes: z.object({
    number: z.string().min(1),
    customerId: z.string().nullable().optional(),
    projectId: z.string().nullable().optional(),
    totalIsk: z.number().nonnegative().optional(),
    validTo: z.string().nullable().optional(),
    status: z.string().optional(),
    notes: z.string().nullable().optional(),
  }).partial({ number: true }),

  pricing: z.object({
    name: z.string().min(1),
    monthlyIsk: z.number().nonnegative(),
    deliveryIsk: z.number().nonnegative(),
    minMonths: z.number().int().positive().optional(),
    note: z.string().nullable().optional(),
  }).partial({ name: true, monthlyIsk: true, deliveryIsk: true }),

  invoices: z.object({
    number: z.string().min(1),
    customerId: z.string().nullable().optional(),
    contractNumber: z.string().nullable().optional(),
    period: z.string().min(1),
    units: z.number().int().nonnegative().optional(),
    amountIsk: z.number().nonnegative().optional(),
    status: z.string().optional(),
    bcRef: z.string().nullable().optional(),
  }).partial({ number: true, period: true }),

  damages: z.object({
    unitId: z.string().min(1),
    date: z.string().min(1),
    description: z.string().min(1),
    cause: z.string(),
    responsible: z.string().nullable().optional(),
    projectId: z.string().nullable().optional(),
    costIsk: z.number().nonnegative().optional(),
    rebilled: z.boolean().optional(),
    status: z.string().optional(),
  }).partial({ unitId: true, date: true, description: true, cause: true }),

  maintenance: z.object({
    unitId: z.string().min(1),
    date: z.string().min(1),
    type: z.string(),
    note: z.string().nullable().optional(),
    costIsk: z.number().nonnegative().optional(),
    by: z.string().nullable().optional(),
  }).partial({ unitId: true, date: true, type: true }),

  docs: z.object({
    ref: z.string().min(1),
    name: z.string().min(1),
    kind: z.string(),
    size: z.string(),
    date: z.string(),
  }).partial({ ref: true, name: true, kind: true, size: true, date: true }),

  users: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    role: z.string().optional(),
    active: z.boolean().optional(),
    lastLogin: z.string().nullable().optional(),
  }).partial({ name: true, email: true }),
};
