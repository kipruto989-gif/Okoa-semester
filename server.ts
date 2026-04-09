import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const upload = multer({ dest: "uploads/" });

  // API route for PDF text extraction
  app.post("/api/extract-text", upload.single("pdf"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const dataBuffer = fs.readFileSync(req.file.path);
      const data = await pdf(dataBuffer);

      // Clean up the uploaded file
      fs.unlinkSync(req.file.path);

      if (!data.text || data.text.trim().length === 0) {
        return res.status(400).json({ error: "No text found in PDF. It might be a scanned document." });
      }

      res.json({ text: data.text });
    } catch (error) {
      console.error("PDF Extraction Error:", error);
      res.status(500).json({ error: "Failed to extract text from PDF" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
