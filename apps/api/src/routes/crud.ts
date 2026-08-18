import { Router } from "express";
import { prisma } from "../db.js";
import { SCHEMAS } from "../validation.js";
import { asyncHandler } from "../asyncHandler.js";

// kind (URL segment, matches @stolpi/shared collection names) -> Prisma delegate
const DELEGATES: Record<string, any> = {
  units: prisma.unit,
  projects: prisma.project,
  customers: prisma.customer,
  contacts: prisma.contact,
  deals: prisma.deal,
  activities: prisma.activity,
  targets: prisma.salesTarget,
  requests: prisma.serviceRequest,
  // "contracts" is handled by its own route (see routes/contracts.ts) — samningar erfa
  // viðskiptavin/tímabil/einingar frá tengdu verkefni og hafa hliðaráhrif á einingastöðu, sem er
  // meira en generic CRUD styður.
  quotes: prisma.quote,
  pricing: prisma.priceItem,
  invoices: prisma.invoice,
  damages: prisma.damage,
  maintenance: prisma.maintenanceEntry,
  docs: prisma.doc,
  users: prisma.user,
};

export const CRUD_KINDS = Object.keys(DELEGATES);

/** Generic REST CRUD router — GET/POST list+item, PUT update, DELETE — shared by all 13 entity kinds.
 * Errors (validation, not-found, unique/FK constraints) all flow to errorHandler.ts via asyncHandler. */
export function crudRouter(kind: string): Router {
  const router = Router();
  const delegate = DELEGATES[kind];
  const schema = SCHEMAS[kind];
  if (!delegate) throw new Error(`Óþekkt gagnagerð: ${kind}`);

  router.get(
    "/",
    asyncHandler(async (_req, res) => {
      const rows = await delegate.findMany();
      res.json(rows);
    }),
  );

  router.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const row = await delegate.findUnique({ where: { id: req.params.id } });
      if (!row) return res.status(404).json({ error: "Fannst ekki" });
      res.json(row);
    }),
  );

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const row = await delegate.create({ data: parsed.data });
      res.status(201).json(row);
    }),
  );

  router.put(
    "/:id",
    asyncHandler(async (req, res) => {
      const parsed = schema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const row = await delegate.update({ where: { id: req.params.id }, data: parsed.data });
      res.json(row);
    }),
  );

  router.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      await delegate.delete({ where: { id: req.params.id } });
      res.status(204).end();
    }),
  );

  return router;
}
