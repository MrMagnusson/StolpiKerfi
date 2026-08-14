// One-time remote seed trigger for the deployed demo — exists because the Postgres instance is only
// reachable from inside Railway's private network (postgres.railway.internal), not from a local dev
// machine, and enabling public DB networking just to run a seed script isn't worth the exposure.
// This calls the exact same seedDatabase() used by `npm run db:seed` locally, over the API's normal
// public HTTPS endpoint. Gated by ADMIN_SEED_TOKEN — disabled entirely (404) if that env var isn't set.
import { Router } from "express";
import { prisma } from "../db.js";
import { seedDatabase } from "../seed.js";
import { asyncHandler } from "../asyncHandler.js";

export const adminRouter = Router();

adminRouter.post(
  "/seed",
  asyncHandler(async (req, res) => {
    const token = process.env.ADMIN_SEED_TOKEN;
    if (!token) return res.status(404).json({ error: "Endapunktur fannst ekki" });
    if (req.query.token !== token) return res.status(401).json({ error: "Rangt eða vantandi token" });

    const existing = await prisma.customer.count();
    if (existing > 0 && req.query.force !== "true") {
      return res.status(409).json({ error: `Gagnagrunnur er ekki tómur (${existing} viðskiptavinir). Bættu við ?force=true til að sá yfir hvort sem er.` });
    }

    await seedDatabase(prisma);
    res.json({ ok: true });
  }),
);
