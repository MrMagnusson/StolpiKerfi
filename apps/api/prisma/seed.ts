// CLI entry point (run via `npm run db:seed`, uses tsx) — actual data lives in src/seed.ts so the
// admin seed endpoint (routes/admin.ts) can reuse the exact same definition.
import { PrismaClient } from "@prisma/client";
import { seedDatabase } from "../src/seed.js";

const prisma = new PrismaClient();

seedDatabase(prisma)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
