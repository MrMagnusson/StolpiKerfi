// Photo upload — stores to local disk under UPLOAD_DIR (README.md notes this is a stand-in for a
// production S3/Blob + thumbnail pipeline). Used by the unit detail page's condition photo slots
// and the Vettvangur mobile intake flow's camera capture groups.
import { Router } from "express";
import multer, { MulterError } from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";

const uploadDir = path.resolve(process.env.UPLOAD_DIR || "./uploads");
fs.mkdirSync(uploadDir, { recursive: true });

// Only real images are accepted — the extension on disk is derived from the verified mimetype, never
// from the client-supplied filename, so an attacker can't smuggle an .html/.svg file onto /uploads/.
const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${ALLOWED_MIME[file.mimetype] ?? ".jpg"}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME[file.mimetype]) return cb(new Error("Aðeins JPEG, PNG eða WebP myndir eru leyfðar."));
    cb(null, true);
  },
});

export const uploadsRouter = Router();

uploadsRouter.post("/", (req, res) => {
  upload.single("photo")(req, res, (err) => {
    if (err instanceof MulterError) {
      const message = err.code === "LIMIT_FILE_SIZE" ? "Mynd er of stór (hámark 8 MB)." : "Ekki tókst að hlaða upp mynd.";
      return res.status(400).json({ error: message });
    }
    if (err) return res.status(400).json({ error: (err as Error).message });
    if (!req.file) return res.status(400).json({ error: "Engin mynd móttekin" });
    res.status(201).json({ url: `/uploads/${req.file.filename}` });
  });
});
