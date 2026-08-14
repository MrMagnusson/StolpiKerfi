// Ported from buildMatch()/scoreUnit() call sites in Stólpi Kerfi.dc.html ("pörun" section, lines 1503-1532).
import { Router } from "express";
import { prisma } from "../db.js";
import { buildMatch } from "@stolpi/shared";
import { asyncHandler } from "../asyncHandler.js";

export const matchRouter = Router();

matchRouter.get(
  "/:projectId",
  asyncHandler(async (req, res) => {
    const project = await prisma.project.findUnique({ where: { id: req.params.projectId } });
    if (!project) return res.status(404).json({ error: "Verkefni fannst ekki" });

    const units = await prisma.unit.findMany();

    const result = buildMatch(project as any, units as any);
    res.json(result);
  }),
);

// "Taka frá fyrir verkefnið" — reserve a recommended unit for the project's customer.
matchRouter.post(
  "/:projectId/reserve/:unitId",
  asyncHandler(async (req, res) => {
    const project = await prisma.project.findUnique({ where: { id: req.params.projectId } });
    if (!project) return res.status(404).json({ error: "Verkefni fannst ekki" });
    const unit = await prisma.unit.findUnique({ where: { id: req.params.unitId } });
    if (!unit) return res.status(404).json({ error: "Eining fannst ekki" });
    const updated = await prisma.unit.update({
      where: { id: req.params.unitId },
      data: { status: "reserved", customerId: project.customerId },
    });
    res.json(updated);
  }),
);
