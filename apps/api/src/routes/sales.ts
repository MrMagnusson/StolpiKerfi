// Ported from renderVals() "sala" section, Stólpi Kerfi.dc.html lines 1534-1613.
import { Router } from "express";
import { prisma } from "../db.js";
import { DEAL_STAGES, STAGE_PROB, MONTHS, weightedDealValue, short, type DealStage } from "@stolpi/shared";

export const salesRouter = Router();

function inYear(dateStr: string | null, year: number, month: number): boolean {
  if (!dateStr) return false;
  const [y, m] = dateStr.slice(0, 7).split("-");
  return Number(y) === year && Number(m) === month;
}

salesRouter.get("/plan", async (req, res) => {
  const owner = (req.query.owner as string) || "all";
  const deals = await prisma.deal.findMany();
  const targets = await prisma.salesTarget.findMany();
  const scoped = owner === "all" ? deals : deals.filter((d) => d.owner === owner);

  const year = new Date().getFullYear();
  const rows = MONTHS.map((name, i) => {
    const m = i + 1;
    const target = targets
      .filter((t) => t.year === year && t.month === m && (owner === "all" || t.owner === owner))
      .reduce((s, t) => s + t.targetIsk, 0);
    const won = scoped.filter((d) => d.stage === "unnid" && inYear(d.expectedClose, year, m)).reduce((s, d) => s + d.valueIsk, 0);
    const pipe = scoped
      .filter((d) => d.stage !== "unnid" && d.stage !== "tapad" && inYear(d.expectedClose, year, m))
      .reduce((s, d) => s + weightedDealValue(d.valueIsk, d.stage as DealStage), 0);
    return { m, name, target, won, pipe, forecast: won + pipe, pct: target ? Math.round((won / target) * 100) : null, gap: won - target };
  });

  const tot = rows.reduce((a, r) => ({ target: a.target + r.target, won: a.won + r.won, pipe: a.pipe + r.pipe }), { target: 0, won: 0, pipe: 0 });

  res.json({
    rows: rows.map((r) => ({ ...r, targetLabel: short(r.target), wonLabel: short(r.won), forecastLabel: short(r.forecast) })),
    total: { ...tot, targetLabel: short(tot.target), wonLabel: short(tot.won), forecastLabel: short(tot.won + tot.pipe) },
  });
});

salesRouter.get("/pipeline", async (req, res) => {
  const owner = (req.query.owner as string) || "all";
  const deals = await prisma.deal.findMany();
  const customers = await prisma.customer.findMany();
  const cName = (id: string | null) => customers.find((c) => c.id === id)?.name ?? "—";
  const scoped = owner === "all" ? deals : deals.filter((d) => d.owner === owner);

  const stageCols = Object.keys(DEAL_STAGES).map((st) => {
    const items = scoped.filter((d) => d.stage === st);
    return {
      stage: st,
      label: DEAL_STAGES[st as DealStage],
      prob: STAGE_PROB[st as DealStage],
      total: short(items.reduce((s, d) => s + d.valueIsk, 0)),
      deals: items.map((d) => ({
        id: d.id,
        title: d.title,
        customer: cName(d.customerId),
        owner: d.owner,
        value: short(d.valueIsk),
        weighted: st !== "unnid" && st !== "tapad" ? short(weightedDealValue(d.valueIsk, d.stage as DealStage)) : null,
      })),
    };
  });
  res.json({ stageCols });
});
