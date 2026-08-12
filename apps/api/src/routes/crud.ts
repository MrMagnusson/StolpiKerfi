import { Router } from "express";
import { prisma } from "../db.js";
import { inbound, outbound } from "../serialize.js";
import { SCHEMAS } from "../validation.js";

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
  contracts: prisma.contract,
  quotes: prisma.quote,
  pricing: prisma.priceItem,
  invoices: prisma.invoice,
  damages: prisma.damage,
  maintenance: prisma.maintenanceEntry,
  docs: prisma.doc,
  users: prisma.user,
};

export const CRUD_KINDS = Object.keys(DELEGATES);

/** Generic REST CRUD router — GET/POST list+item, PUT update, DELETE — shared by all 13 entity kinds. */
export function crudRouter(kind: string): Router {
  const router = Router();
  const delegate = DELEGATES[kind];
  const schema = SCHEMAS[kind];
  if (!delegate) throw new Error(`Óþekkt gagnagerð: ${kind}`);

  router.get("/", async (_req, res) => {
    const rows = await delegate.findMany();
    res.json(rows.map((r: Record<string, unknown>) => outbound(kind, r)));
  });

  router.get("/:id", async (req, res) => {
    const row = await delegate.findUnique({ where: { id: req.params.id } });
    if (!row) return res.status(404).json({ error: "Fannst ekki" });
    res.json(outbound(kind, row));
  });

  router.post("/", async (req, res) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const row = await delegate.create({ data: inbound(kind, parsed.data) });
    res.status(201).json(outbound(kind, row));
  });

  router.put("/:id", async (req, res) => {
    const parsed = schema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    try {
      const row = await delegate.update({ where: { id: req.params.id }, data: inbound(kind, parsed.data) });
      res.json(outbound(kind, row));
    } catch {
      res.status(404).json({ error: "Fannst ekki" });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      await delegate.delete({ where: { id: req.params.id } });
      res.status(204).end();
    } catch {
      res.status(404).json({ error: "Fannst ekki" });
    }
  });

  return router;
}
