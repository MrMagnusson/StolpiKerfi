// Photo upload — stores to local disk under UPLOAD_DIR (README.md notes this is a stand-in for a
// production S3/Blob + thumbnail pipeline). Used by the unit detail page's condition photo slots
// and the Vettvangur mobile intake flow's camera capture groups.
import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";

const uploadDir = path.resolve(process.env.UPLOAD_DIR || "./uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } });

export const uploadsRouter = Router();

uploadsRouter.post("/", upload.single("photo"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Engin mynd móttekin" });
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});
