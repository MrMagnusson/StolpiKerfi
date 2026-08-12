// Ported from runBilling()/exportBC() in Stólpi Kerfi.dc.html lines 1206-1230.
import { Router } from "express";
import { prisma } from "../db.js";

export const billingRouter = Router();

function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

billingRouter.get("/invoices", async (req, res) => {
  const period = (req.query.period as string) || currentPeriod();
  const invoices = await prisma.invoice.findMany({ where: { period } });
  res.json(invoices);
});

/** "Keyra leigulínur tímabilsins" — one invoice line per active/expiring contract missing a line for the period. */
billingRouter.post("/run", async (req, res) => {
  const period = (req.body.period as string) || currentPeriod();
  const [contracts, invoices] = await Promise.all([
    prisma.contract.findMany({ where: { status: { in: ["virkur", "rennur_ut"] } } }),
    prisma.invoice.findMany({ where: { period } }),
  ]);
  let n = invoices.length;
  const toCreate = contracts.filter((c) => !invoices.some((i) => i.contractNumber === c.number));
  const created = [];
  for (const c of toCreate) {
    n += 1;
    const unitIds: string[] = JSON.parse(c.unitIds || "[]");
    const invoice = await prisma.invoice.create({
      data: {
        number: `RE-${period.replace("-", "")}-${String(n).padStart(3, "0")}`,
        customerId: c.customerId,
        contractNumber: c.number,
        period,
        units: unitIds.length,
        amountIsk: c.monthlyIsk,
        status: "tilbuinn",
        bcRef: null,
      },
    });
    created.push(invoice);
  }
  res.json({ created: created.length, invoices: created });
});

/** "Flytja út í Business Central" — CSV of unsent invoice lines for the period; marks them sent with a BC reference. */
billingRouter.post("/export-bc", async (req, res) => {
  const period = (req.body.period as string) || currentPeriod();
  const invoices = await prisma.invoice.findMany({ where: { period, status: { notIn: ["sendur", "greiddur"] } } });
  const customers = await prisma.customer.findMany();
  const cName = (id: string | null) => customers.find((c) => c.id === id)?.name ?? "";
  const cKt = (id: string | null) => customers.find((c) => c.id === id)?.kennitala ?? "";

  const rows = [["DocumentNo", "CustomerName", "CustomerNo", "PostingDate", "Description", "Quantity", "UnitPrice", "DimensionContract"]].concat(
    invoices.map((i) => [i.number, cName(i.customerId), cKt(i.customerId), `${period}-01`, `Leiga á einingum ${period}`, String(i.units || 1), String(i.amountIsk), i.contractNumber ?? ""]),
  );
  const csv = rows.map((r) => r.join(";")).join("\n");

  for (const i of invoices) {
    await prisma.invoice.update({
      where: { id: i.id },
      data: { status: "sendur", bcRef: `BC-INV-${Math.floor(10500 + Math.random() * 400)}` },
    });
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="BC-leiga-${period}.csv"`);
  res.send(`﻿${csv}`);
});
