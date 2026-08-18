// Samningar eru ekki lengur hrein generic CRUD-gerð (sjá crud.ts) — skrifstofan velur einingarnar
// á VERKEFNINU sjálfu (Project.unitIds), ekki á samningnum. Þegar samningur er tengdur verkefni
// erfir hann viðskiptavin/tímabil/einingar þaðan sjálfkrafa, og valdar einingar færast í stöðuna
// "Frátekin" (nema þær séu þegar í_leigu/skemmdar — þá er bara viðskiptavinur uppfærður).
import { Router } from "express";
import { prisma } from "../db.js";
import { SCHEMAS } from "../validation.js";
import { asyncHandler } from "../asyncHandler.js";

export const contractsRouter = Router();

async function applyProjectDerivedFields(data: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (!data.projectId || typeof data.projectId !== "string") return data;
  const project = await prisma.project.findUnique({ where: { id: data.projectId } });
  if (!project) return data;
  return {
    ...data,
    customerId: project.customerId,
    startDate: project.startDate,
    endDate: project.endDate,
    unitIds: project.unitIds,
  };
}

async function reserveUnits(unitIds: string[], customerId: string | null) {
  for (const unitId of unitIds) {
    const unit = await prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) continue;
    if (unit.status === "available" || unit.status === "returned") {
      await prisma.unit.update({ where: { id: unitId }, data: { status: "reserved", customerId } });
    } else if (unit.customerId !== customerId) {
      await prisma.unit.update({ where: { id: unitId }, data: { customerId } });
    }
  }
}

contractsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await prisma.contract.findMany());
  }),
);

contractsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const row = await prisma.contract.findUnique({ where: { id: req.params.id } });
    if (!row) return res.status(404).json({ error: "Fannst ekki" });
    res.json(row);
  }),
);

contractsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = SCHEMAS.contracts.safeParse(await applyProjectDerivedFields(req.body));
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const row = await prisma.contract.create({ data: parsed.data as any });
    await reserveUnits(row.unitIds, row.customerId);
    res.status(201).json(row);
  }),
);

contractsRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const parsed = SCHEMAS.contracts.safeParse(await applyProjectDerivedFields(req.body));
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const row = await prisma.contract.update({ where: { id: req.params.id }, data: parsed.data as any });
    if (row.unitIds.length) await reserveUnits(row.unitIds, row.customerId);
    res.json(row);
  }),
);

contractsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.contract.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);
