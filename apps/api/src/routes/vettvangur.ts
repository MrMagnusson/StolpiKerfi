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
  // Every photo taken during the flow, tagged "group::url" (see shared/intakeFlow.ts) — persisted
  // on the request itself as the full intake report, and used here to seed the unit's 4 legacy
  // single-photo slots so the existing Ástandsmyndir panel shows something immediately.
  photos: z.array(z.string()).optional(),
  // One entry per "ástand" checklist item flagged with an issue — each carries its own
  // description/photos now (previously a single combined damage per intake).
  damages: z
    .array(
      z.object({
        description: z.string().min(1),
        cause: z.string().min(1),
        responsible: z.string().nullable().optional(),
        costIsk: z.number().nonnegative().default(0),
        photos: z.array(z.string()).optional(),
      }),
    )
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

    const { location, photos = [], damages = [] } = parsed.data;
    const pick = (group: string) => photos.find((p) => p.startsWith(`${group}::`))?.slice(group.length + 2);

    const [unit, updatedRequest] = await prisma.$transaction([
      prisma.unit.update({
        where: { id: request.unitId },
        data: {
          status: "available",
          location,
          photoMottaka: pick("koma"),
          photoStandsett: pick("standsett"),
          photoAstand: pick("astand_uti") ?? pick("astand_inni"),
          photoSkemmd: damages[0]?.photos?.[0],
        },
      }),
      prisma.serviceRequest.update({ where: { id: request.id }, data: { status: "lokid", photos } }),
    ]);

    const damageRows = [];
    for (const d of damages) {
      damageRows.push(
        await prisma.damage.create({
          data: {
            unitId: request.unitId,
            date: iso(0),
            description: d.description,
            cause: d.cause,
            responsible: d.responsible ?? null,
            projectId: request.projectId,
            contractId: request.contractId,
            costIsk: d.costIsk,
            photos: d.photos ?? [],
            rebilled: d.cause === "vidskiptavinur",
            status: "skrad",
          },
        }),
      );
    }

    res.json({ unit, request: updatedRequest, damages: damageRows });
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
