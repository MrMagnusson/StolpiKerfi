// Ported from runBilling()/exportBC() in Stólpi Kerfi.dc.html lines 1206-1230.
import { Router } from "express";
import { prisma } from "../db.js";
import { asyncHandler } from "../asyncHandler.js";

export const billingRouter = Router();

function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Quotes a CSV field if it contains the delimiter, a quote, or a newline — customer/contract names are free text. */
function csvField(v: string): string {
  if (/[;"\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

billingRouter.get(
  "/invoices",
  asyncHandler(async (req, res) => {
    const period = (req.query.period as string) || currentPeriod();
    const invoices = await prisma.invoice.findMany({ where: { period } });
    res.json(invoices);
  }),
);

/** "Keyra leigulínur tímabilsins" — one invoice line per active/expiring contract missing a line for the period. */
billingRouter.post(
  "/run",
  asyncHandler(async (req, res) => {
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
      const invoice = await prisma.invoice.create({
        data: {
          number: `RE-${period.replace("-", "")}-${String(n).padStart(3, "0")}`,
          customerId: c.customerId,
          contractNumber: c.number,
          period,
          units: c.unitIds.length,
          amountIsk: c.monthlyIsk,
          status: "tilbuinn",
          bcRef: null,
        },
      });
      created.push(invoice);
    }
    res.json({ created: created.length, invoices: created });
  }),
);

/** "Flytja út í Business Central" — CSV of unsent invoice lines for the period; marks them sent with a BC reference. */
billingRouter.post(
  "/export-bc",
  asyncHandler(async (req, res) => {
    const period = (req.body.period as string) || currentPeriod();
    const invoices = await prisma.invoice.findMany({ where: { period, status: { notIn: ["sendur", "greiddur"] } } });
    const customers = await prisma.customer.findMany();
    const cName = (id: string | null) => customers.find((c) => c.id === id)?.name ?? "";
    const cKt = (id: string | null) => customers.find((c) => c.id === id)?.kennitala ?? "";

    const rows = [["DocumentNo", "CustomerName", "CustomerNo", "PostingDate", "Description", "Quantity", "UnitPrice", "DimensionContract"]].concat(
      invoices.map((i) => [i.number, cName(i.customerId), cKt(i.customerId), `${period}-01`, `Leiga á einingum ${period}`, String(i.units || 1), String(i.amountIsk), i.contractNumber ?? ""]),
    );
    const csv = rows.map((r) => r.map(csvField).join(";")).join("\n");

    if (invoices.length) {
      await prisma.$transaction(
        invoices.map((i) =>
          prisma.invoice.update({
            where: { id: i.id },
            data: { status: "sendur", bcRef: `BC-INV-${Math.floor(10500 + Math.random() * 400)}` },
          }),
        ),
      );
    }

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="BC-leiga-${period}.csv"`);
    res.send(`﻿${csv}`);
  }),
);
