// Ported from renderVals() "yfirlit" section, Stólpi Kerfi.dc.html lines 1435-1474.
import { Router } from "express";
import { prisma } from "../db.js";
import { UNIT_STATUS, CONTRACT_STATUS, DEAL_STAGES, REQ_TYPE, ACTIVITY_TYPE, short } from "@stolpi/shared";
import { iso } from "../util.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", async (_req, res) => {
  const [units, contracts, deals, activities, requests, customers] = await Promise.all([
    prisma.unit.findMany(),
    prisma.contract.findMany(),
    prisma.deal.findMany(),
    prisma.activity.findMany(),
    prisma.serviceRequest.findMany(),
    prisma.customer.findMany(),
  ]);

  const today = iso(0);
  const cName = (id: string | null) => customers.find((c) => c.id === id)?.name ?? "—";
  const uCode = (id: string | null) => units.find((u) => u.id === id)?.code ?? "—";

  const counts: Record<string, number> = {};
  for (const k of Object.keys(UNIT_STATUS)) counts[k] = units.filter((u) => u.status === k).length;

  const openReq = requests.filter((r) => r.status === "ny" || r.status === "i_vinnslu");
  const openDealsAll = deals.filter((d) => d.stage !== "unnid" && d.stage !== "tapad");
  const pipeline = openDealsAll.reduce((s, d) => s + (d.valueIsk || 0), 0);
  const utilisation = Math.round((units.filter((u) => u.status === "in_use").length / Math.max(1, units.length)) * 100);
  const mrr = contracts.filter((c) => c.status === "virkur" || c.status === "rennur_ut").reduce((s, c) => s + (c.monthlyIsk || 0), 0);

  const dashStats = [
    { label: "Lausar einingar", value: String(counts.available ?? 0), note: `af ${units.length} í flotanum` },
    { label: "Nýtingarhlutfall", value: `${utilisation}%`, note: "einingar í leigu núna" },
    { label: "Leigutekjur / mán.", value: short(mrr), note: `${contracts.filter((c) => c.status === "virkur").length} virkir samningar` },
    { label: "Opnar beiðnir", value: String(openReq.length), note: `${openReq.filter((r) => r.dueDate && r.dueDate < today).length} komnar fram yfir` },
    { label: "Opið pipeline", value: short(pipeline), note: `${openDealsAll.length} tækifæri í vinnslu` },
  ];

  type AttentionRow = { title: string; meta: string; tag: string; tone: string; sort: string; kind: string; id: string };
  const attention: AttentionRow[] = [];
  for (const r of openReq.filter((r) => r.dueDate && r.dueDate <= iso(3))) {
    attention.push({
      title: r.title,
      meta: `${uCode(r.unitId)} · ${REQ_TYPE[r.type as keyof typeof REQ_TYPE]} · ${r.assignedTo ?? "—"}`,
      tag: r.dueDate! < today ? "Yfir tíma" : "Á næstunni",
      tone: r.dueDate! < today ? "bad" : "warn",
      sort: r.dueDate!,
      kind: "requests",
      id: r.id,
    });
  }
  for (const a of activities.filter((a) => !a.done && a.dueDate && a.dueDate < today)) {
    attention.push({
      title: a.subject,
      meta: `${ACTIVITY_TYPE[a.type as keyof typeof ACTIVITY_TYPE]} · ${cName(a.customerId)}`,
      tag: "Yfir tíma",
      tone: "bad",
      sort: a.dueDate!,
      kind: "activities",
      id: a.id,
    });
  }
  for (const u of units.filter((u) => u.status === "damaged" || u.status === "returned")) {
    attention.push({
      title: `${u.code} bíður afgreiðslu`,
      meta: `${u.status === "damaged" ? "Skemmd" : "Komin til baka"} · ${u.location}`,
      tag: u.status === "damaged" ? "Skemmd" : "Skil",
      tone: u.status === "damaged" ? "bad" : "warn",
      sort: "9998",
      kind: "units",
      id: u.id,
    });
  }
  for (const c of contracts.filter((c) => c.status === "rennur_ut")) {
    attention.push({
      title: `${c.number} rennur út ${c.endDate}`,
      meta: `${cName(c.customerId)} · ${short(c.monthlyIsk)} á mánuði`,
      tag: "Framlengja?",
      tone: "warn",
      sort: c.endDate ?? "9999",
      kind: "contracts",
      id: c.id,
    });
  }
  attention.sort((a, b) => (a.sort < b.sort ? -1 : 1));

  const maxFleet = Math.max(1, ...Object.values(counts));
  const fleetRows = Object.keys(UNIT_STATUS).map((k) => ({
    key: k,
    label: UNIT_STATUS[k as keyof typeof UNIT_STATUS].label,
    count: counts[k] ?? 0,
    tone: UNIT_STATUS[k as keyof typeof UNIT_STATUS].tone,
    percent: Math.round(((counts[k] ?? 0) / maxFleet) * 100),
  }));

  const stageRows = (["nytt", "i_samskiptum", "tilbod_sent", "samningar"] as const).map((st) => {
    const items = openDealsAll.filter((d) => d.stage === st);
    return { label: DEAL_STAGES[st], count: items.length, value: short(items.reduce((s, d) => s + (d.valueIsk || 0), 0)) };
  });

  const contractSoon = [...contracts]
    .sort((a, b) => ((a.endDate ?? "9999") < (b.endDate ?? "9999") ? -1 : 1))
    .slice(0, 4)
    .map((c) => ({
      id: c.id,
      number: c.number,
      customer: cName(c.customerId),
      period: `${c.startDate ?? "—"} → ${c.endDate ?? "—"}`,
      status: CONTRACT_STATUS[c.status as keyof typeof CONTRACT_STATUS].label,
      tone: CONTRACT_STATUS[c.status as keyof typeof CONTRACT_STATUS].tone,
    }));

  res.json({ dashStats, attention: attention.slice(0, 7), fleetRows, stageRows, contractSoon });
});
