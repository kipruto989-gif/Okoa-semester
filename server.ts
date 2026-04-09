import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");
const mammoth = require("mammoth");
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  const upload = multer({ dest: "uploads/" });

  // API route for document text extraction (PDF and Word)
  app.post("/api/extract-text", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const filePath = req.file.path;
      const originalName = req.file.originalname.toLowerCase();
      let extractedText = "";

      if (originalName.endsWith(".pdf")) {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        extractedText = data.text;
      } else if (originalName.endsWith(".docx")) {
        const result = await mammoth.extractRawText({ path: filePath });
        extractedText = result.value;
      } else {
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: "Unsupported file format. Please upload PDF or DOCX." });
      }

      // Clean up the uploaded file
      fs.unlinkSync(filePath);

      if (!extractedText || extractedText.trim().length === 0) {
        return res.status(400).json({ error: "No text found in the document." });
      }

      res.json({ text: extractedText });
    } catch (error) {
      console.error("Extraction Error:", error);
      res.status(500).json({ error: "Failed to extract text from document" });
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
