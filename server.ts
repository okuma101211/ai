import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("analytics.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    input_content TEXT,
    target_country TEXT,
    target_generation TEXT,
    target_gender TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analytics_id INTEGER,
    is_accurate BOOLEAN,
    feedback_text TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.post("/api/analytics", (req, res) => {
    try {
      const { inputContent, targetCountry, targetGeneration, targetGender } = req.body;
      const stmt = db.prepare(
        "INSERT INTO analytics (input_content, target_country, target_generation, target_gender) VALUES (?, ?, ?, ?)"
      );
      const info = stmt.run(inputContent, targetCountry, targetGeneration, targetGender);
      res.json({ success: true, id: info.lastInsertRowid });
    } catch (error) {
      console.error("Error saving analytics:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/feedback", (req, res) => {
    try {
      const { analyticsId, isAccurate, feedbackText } = req.body;
      const stmt = db.prepare(
        "INSERT INTO feedback (analytics_id, is_accurate, feedback_text) VALUES (?, ?, ?)"
      );
      stmt.run(analyticsId, isAccurate, feedbackText || null);
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving feedback:", error);
      res.status(500).json({ error: "Internal Server Error" });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
