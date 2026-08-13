// Centralized error mapping — every route reaches here via asyncHandler.ts instead of leaving
// callers to guess whether a caught error means "not found", "conflict", or a real server fault.
import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

function targetFields(meta: unknown): string {
  const t = (meta as { target?: string[] | string } | undefined)?.target;
  if (!t) return "";
  return Array.isArray(t) ? t.join(", ") : String(t);
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: err.flatten() });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2025": // record to update/delete not found
        return res.status(404).json({ error: "Fannst ekki" });
      case "P2002": { // unique constraint
        const fields = targetFields(err.meta);
        return res.status(409).json({ error: `Þetta gildi er þegar til (${fields || "einkvæmt gildi"}).` });
      }
      case "P2003": // foreign key constraint (delete blocked by related rows)
      case "P2014":
        return res.status(409).json({ error: "Ekki hægt að eyða — önnur skráning er tengd þessu." });
      default:
        console.error("Prisma error", err.code, err.message);
        return res.status(500).json({ error: "Gagnagrunnsvilla kom upp." });
    }
  }

  console.error(err);
  res.status(500).json({ error: "Óvænt villa kom upp á þjóninum." });
}
