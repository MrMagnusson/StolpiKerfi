import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import { CRUD_KINDS, crudRouter } from "./routes/crud.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { matchRouter } from "./routes/match.js";
import { salesRouter } from "./routes/sales.js";
import { billingRouter } from "./routes/billing.js";
import { bcRouter } from "./routes/bc.js";
import { vettvangurRouter } from "./routes/vettvangur.js";
import { uploadsRouter } from "./routes/uploads.js";

const app = express();
app.use(cors());
app.use(express.json());

const uploadDir = path.resolve(process.env.UPLOAD_DIR || "./uploads");
app.use("/uploads", express.static(uploadDir));

for (const kind of CRUD_KINDS) {
  app.use(`/api/${kind}`, crudRouter(kind));
}
app.use("/api/dashboard", dashboardRouter);
app.use("/api/match", matchRouter);
app.use("/api/sales", salesRouter);
app.use("/api/billing", billingRouter);
app.use("/api/bc", bcRouter);
app.use("/api/vettvangur", vettvangurRouter);
app.use("/api/uploads", uploadsRouter);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`Stólpi API keyrir á http://localhost:${port}`);
});
