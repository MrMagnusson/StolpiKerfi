// Ported from next() (final step) in Stólpi Vettvangur.dc.html lines 303-320: unit -> available at
// the chosen location, request -> lokið, and any flagged "ástand" issues written to the unit's
// Ástandsskrá with cause/responsible/cost and rebilled = (cause === "vidskiptavinur").
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { iso } from "../util.js";
import { asyncHandler } from "../asyncHandler.js";

export const vettvangurRouter = Router();

vettvangurRouter.get(
  "/requests",
  asyncHandler(async (_req, res) => {
    const requests = await prisma.serviceRequest.findMany({
      where: { status: { in: ["ny", "i_vinnslu", "tilbuin", "lokid"] } },
      include: { unit: true },
    });
    res.json(requests);
  }),
);

const completeSchema = z.object({
  location: z.string().min(1),
  damage: z
    .object({
      description: z.string().min(1),
      cause: z.string().min(1),
      responsible: z.string().nullable().optional(),
      costIsk: z.number().nonnegative().default(0),
    })
    .nullable()
    .optional(),
});

vettvangurRouter.post(
  "/requests/:id/complete",
  asyncHandler(async (req, res) => {
    const parsed = completeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const request = await prisma.serviceRequest.findUnique({ where: { id: req.params.id } });
    if (!request || !request.unitId) return res.status(404).json({ error: "Beiðni fannst ekki" });
    if (request.status === "lokid") return res.status(409).json({ error: "Beiðni er þegar lokið." });

    const { location, damage } = parsed.data;

    const [unit, updatedRequest] = await prisma.$transaction([
      prisma.unit.update({ where: { id: request.unitId }, data: { status: "available", location } }),
      prisma.serviceRequest.update({ where: { id: request.id }, data: { status: "lokid" } }),
    ]);

    const damageRow = damage
      ? await prisma.damage.create({
          data: {
            unitId: request.unitId,
            date: iso(0),
            description: damage.description,
            cause: damage.cause,
            responsible: damage.responsible ?? null,
            projectId: request.projectId,
            costIsk: damage.costIsk,
            rebilled: damage.cause === "vidskiptavinur",
            status: "skrad",
          },
        })
      : null;

    res.json({ unit, request: updatedRequest, damage: damageRow });
  }),
);

// Simple (non-intake) job completion — samsetning/uppsetning/viðgerð/flutningur/annað. Unlike
// /complete above, this does NOT touch the unit's rental status (the job isn't about a unit
// returning to the available pool); it just closes the request and, if a unit is attached, logs
// a Viðhaldssaga entry with whatever notes/photos were taken, and optionally moves the unit's
// location (relevant for on-site setup/assembly work).
const completeSimpleSchema = z.object({
  note: z.string().nullable().optional(),
  photos: z.array(z.string()).optional(),
  location: z.string().nullable().optional(),
});

vettvangurRouter.post(
  "/requests/:id/complete-simple",
  asyncHandler(async (req, res) => {
    const parsed = completeSimpleSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const request = await prisma.serviceRequest.findUnique({ where: { id: req.params.id } });
    if (!request) return res.status(404).json({ error: "Beiðni fannst ekki" });
    if (request.status === "lokid") return res.status(409).json({ error: "Beiðni er þegar lokið." });

    const { note, photos, location } = parsed.data;

    const updatedRequest = await prisma.serviceRequest.update({ where: { id: request.id }, data: { status: "lokid" } });

    let maintenanceRow = null;
    if (request.unitId) {
      maintenanceRow = await prisma.maintenanceEntry.create({
        data: {
          unitId: request.unitId,
          date: iso(0),
          type: request.type,
          note: note || null,
          photos: photos ?? [],
          by: request.assignedTo ?? null,
        },
      });
      if (location) {
        await prisma.unit.update({ where: { id: request.unitId }, data: { location } });
      }
    }

    res.json({ request: updatedRequest, maintenance: maintenanceRow });
  }),
);
