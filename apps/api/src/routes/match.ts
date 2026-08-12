// Ported from buildMatch()/scoreUnit() call sites in Stólpi Kerfi.dc.html ("pörun" section, lines 1503-1532).
import { Router } from "express";
import { prisma } from "../db.js";
import { buildMatch } from "@stolpi/shared";
import { outbound } from "../serialize.js";

export const matchRouter = Router();

matchRouter.get("/:projectId", async (req, res) => {
  const project = await prisma.project.findUnique({ where: { id: req.params.projectId } });
  if (!project) return res.status(404).json({ error: "Verkefni fannst ekki" });

  const unitsRaw = await prisma.unit.findMany();
  const units = unitsRaw.map((u) => outbound("units", u)) as any[];
  const projectParsed = outbound("projects", project) as any;

  const result = buildMatch(projectParsed, units);
  res.json(result);
});

// "Taka frá fyrir verkefnið" — reserve a recommended unit for the project's customer.
matchRouter.post("/:projectId/reserve/:unitId", async (req, res) => {
  const project = await prisma.project.findUnique({ where: { id: req.params.projectId } });
  if (!project) return res.status(404).json({ error: "Verkefni fannst ekki" });
  const unit = await prisma.unit.update({
    where: { id: req.params.unitId },
    data: { status: "reserved", customerId: project.customerId },
  });
  res.json(outbound("units", unit));
});
