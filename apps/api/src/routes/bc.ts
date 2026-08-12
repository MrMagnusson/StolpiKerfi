// Stubbed Business Central integration — README.md "Auto-sync spec". Behind a plain interface so a
// real OAuth 2.0 client-credentials connector against BC API v2.0 can be dropped in once BC app
// registration credentials exist, without changing callers.
import { Router } from "express";
import { prisma } from "../db.js";

export const bcRouter = Router();

interface BcConnector {
  test(): Promise<{ ok: boolean; message: string }>;
  sync(): Promise<{ sent: number }>;
}

const stubConnector: BcConnector = {
  async test() {
    return { ok: true, message: "Próftenging — API v2.0 svaraði" };
  },
  async sync() {
    const sendable = await prisma.invoice.findMany({ where: { status: { notIn: ["sendur", "greiddur"] } } });
    for (const i of sendable) {
      await prisma.invoice.update({
        where: { id: i.id },
        data: { status: "sendur", bcRef: `BC-INV-${Math.floor(10500 + Math.random() * 400)}` },
      });
    }
    return { sent: sendable.length };
  },
};

bcRouter.get("/settings", async (_req, res) => {
  const settings = await prisma.bcSettings.findUnique({ where: { id: "singleton" } });
  res.json(settings);
});

bcRouter.put("/settings", async (req, res) => {
  const { environment, company, tenant, schedule, autopost } = req.body;
  const settings = await prisma.bcSettings.update({
    where: { id: "singleton" },
    data: { environment, company, tenant, schedule, autopost },
  });
  res.json(settings);
});

bcRouter.get("/log", async (_req, res) => {
  const log = await prisma.bcLogEntry.findMany({ orderBy: { created: "desc" }, take: 8 });
  res.json(log);
});

bcRouter.post("/test", async (_req, res) => {
  const result = await stubConnector.test();
  const entry = await prisma.bcLogEntry.create({
    data: { title: result.message, time: new Date().toLocaleString("is-IS"), status: "Í lagi", tone: "ok" },
  });
  res.json({ result, entry });
});

bcRouter.post("/sync", async (_req, res) => {
  const result = await stubConnector.sync();
  const entry = await prisma.bcLogEntry.create({
    data: {
      title: `${result.sent} leigulínur sendar í Business Central`,
      time: new Date().toLocaleString("is-IS"),
      status: result.sent ? "Sent" : "Ekkert nýtt",
      tone: result.sent ? "ok" : "neutral",
    },
  });
  res.json({ result, entry });
});
