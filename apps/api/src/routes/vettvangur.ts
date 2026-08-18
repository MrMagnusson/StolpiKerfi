// Ported from next() (final step) in Stólpi Vettvangur.dc.html lines 303-320: unit -> available at
// the chosen location, request -> lokið, and any flagged "ástand" issues written to the unit's
// Ástandsskrá with cause/responsible/cost and rebilled = (cause === "vidskiptavinur"). Extended to
// cover requests with MULTIPLE units (e.g. a whole vinnubúðir camp returned at once) — the mobile
// app walks each unit through the flow independently and submits the whole batch in one call once
// every unit is done.
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
    });
    const allUnitIds = Array.from(new Set(requests.flatMap((r) => r.unitIds)));
    const units = allUnitIds.length ? await prisma.unit.findMany({ where: { id: { in: allUnitIds } } }) : [];
    const unitById = new Map(units.map((u) => [u.id, u]));
    const withUnits = requests.map((r) => ({ ...r, units: r.unitIds.map((id) => unitById.get(id)).filter((u): u is (typeof units)[number] => !!u) }));
    res.json(withUnits);
  }),
);

const completeSchema = z.object({
  // Every photo taken during the flow, tagged "unitId::group::url" (see shared/intakeFlow.ts) —
  // persisted on the request itself as the full intake report, and used here to seed each unit's 4
  // legacy single-photo slots so the existing Ástandsmyndir panel shows something immediately.
  photos: z.array(z.string()).optional(),
  // One entry per unit on the request — each unit was walked through the flow independently on the
  // mobile side, so each carries its own location + damages (one per "ástand" checklist item flagged
  // with an issue, each with its own description/photos now — no more one combined damage per intake).
  units: z
    .array(
      z.object({
        unitId: z.string().min(1),
        location: z.string().min(1),
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
      }),
    )
    .min(1),
});

vettvangurRouter.post(
  "/requests/:id/complete",
  asyncHandler(async (req, res) => {
    const parsed = completeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const request = await prisma.serviceRequest.findUnique({ where: { id: req.params.id } });
    if (!request || !request.unitIds.length) return res.status(404).json({ error: "Beiðni fannst ekki" });
    if (request.status === "lokid") return res.status(409).json({ error: "Beiðni er þegar lokið." });

    const { photos = [], units: unitPayloads } = parsed.data;
    const pick = (unitId: string, group: string) => {
      const prefix = `${unitId}::${group}::`;
      return photos.find((p) => p.startsWith(prefix))?.slice(prefix.length);
    };

    const result = await prisma.$transaction(async (tx) => {
      const updatedUnits = [];
      const damageRows = [];
      for (const up of unitPayloads) {
        // Current-condition photos, not a process history — the "tilbúin" step always captures both
        // (exterior falls back to the arrival photo if that step was somehow skipped). The cover
        // photo on the Einingar list always follows the exterior shot, per how the office wants it.
        const photoUti = pick(up.unitId, "astand_uti") ?? pick(up.unitId, "koma");
        const photoInni = pick(up.unitId, "astand_inni");
        updatedUnits.push(
          await tx.unit.update({
            where: { id: up.unitId },
            data: {
              status: "available",
              location: up.location,
              photoUti,
              photoInni,
              coverPhotoUrl: photoUti,
            },
          }),
        );
        for (const d of up.damages ?? []) {
          damageRows.push(
            await tx.damage.create({
              data: {
                unitId: up.unitId,
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
      }
      const updatedRequest = await tx.serviceRequest.update({ where: { id: request.id }, data: { status: "lokid", photos } });
      return { units: updatedUnits, request: updatedRequest, damages: damageRows };
    });

    res.json(result);
  }),
);

// Simple (non-intake) job completion — samsetning/uppsetning/viðgerð/flutningur/afhending/annað.
// Unlike /complete above, this does NOT touch the unit's rental status by default (most of these
// jobs aren't about a unit changing hands); it just closes the request and, for every unit on it,
// logs a Viðhaldssaga entry with whatever notes/photos were taken, and optionally moves each unit's
// location (relevant for on-site setup/assembly work). For "viðgerð" (repair) jobs a `damage` block
// is also accepted — one Damage record per unit, same shape as the móttöku flow's per-issue capture
// above. For "afhending" (delivery to the customer) a `delivery` block confirms keys were handed
// over and who received the unit — that's the one case here that DOES flip unit status, from
// "reserved" (set when the contract was signed, see routes/contracts.ts) to "in_use".
const completeSimpleSchema = z.object({
  note: z.string().nullable().optional(),
  photos: z.array(z.string()).optional(),
  location: z.string().nullable().optional(),
  damage: z
    .object({
      cause: z.string().min(1),
      responsible: z.string().nullable().optional(),
      costIsk: z.number().nonnegative().default(0),
    })
    .nullable()
    .optional(),
  delivery: z
    .object({
      keysHandedOver: z.boolean(),
      receivedBy: z.string().min(1),
    })
    .nullable()
    .optional(),
});

vettvangurRouter.post(
  "/requests/:id/complete-simple",
  asyncHandler(async (req, res) => {
    const parsed = completeSimpleSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const request = await prisma.serviceRequest.findUnique({ where: { id: req.params.id } });
    if (!request) return res.status(404).json({ error: "Beiðni fannst ekki" });
    if (request.status === "lokid") return res.status(409).json({ error: "Beiðni er þegar lokið." });

    const { note, photos, location, damage, delivery } = parsed.data;
    const composedNote =
      note || (delivery ? `Eining afhent á staðnum. Lyklar afhentar. Móttekið af: ${delivery.receivedBy}.` : null);

    const updatedRequest = await prisma.serviceRequest.update({ where: { id: request.id }, data: { status: "lokid" } });

    const maintenanceRows = [];
    const damageRows = [];
    for (const unitId of request.unitIds) {
      maintenanceRows.push(
        await prisma.maintenanceEntry.create({
          data: {
            unitId,
            date: iso(0),
            type: request.type,
            note: composedNote,
            photos: photos ?? [],
            by: request.assignedTo ?? null,
          },
        }),
      );
      if (damage) {
        damageRows.push(
          await prisma.damage.create({
            data: {
              unitId,
              date: iso(0),
              description: note || `Viðgerð — ${request.title}`,
              cause: damage.cause,
              responsible: damage.responsible ?? null,
              projectId: request.projectId,
              contractId: request.contractId,
              costIsk: damage.costIsk,
              photos: photos ?? [],
              rebilled: damage.cause === "vidskiptavinur",
              status: "lagfaert",
            },
          }),
        );
      }
      if (location) {
        await prisma.unit.update({ where: { id: unitId }, data: { location } });
      }
      if (delivery) {
        const unit = await prisma.unit.findUnique({ where: { id: unitId } });
        if (unit?.status === "reserved") {
          await prisma.unit.update({ where: { id: unitId }, data: { status: "in_use" } });
        }
      }
    }

    res.json({ request: updatedRequest, maintenance: maintenanceRows, damages: damageRows });
  }),
);
