// server.js
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

// ✅ Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.FINNHUB_KEY;

// -- Quote (overview)
app.get("/api/stock/:symbol", async (req, res) => {
  const symbol = req.params.symbol;
  try {
    const resp = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${API_KEY}`
    );
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    console.error("Quote fetch error:", err);
    res.status(500).json({ error: "Failed to fetch stock data" });
  }
});

// -- Candle / historical (for chart)
app.get("/api/candle/:symbol", async (req, res) => {
  const symbol = req.params.symbol;
  const now = Math.floor(Date.now() / 1000);
  const twoWeeksAgo = now - 14 * 24 * 60 * 60; // 14 days ago

  try {
    const resp = await fetch(
      `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=D&from=${twoWeeksAgo}&to=${now}&token=${API_KEY}`
    );
    const data = await resp.json();

    // Ensure proper structure
    if (!data || !Array.isArray(data.t) || !Array.isArray(data.c)) {
      return res.json({ s: "no_data", t: [], c: [] });
    }

    // Trim to last 7 points max
    const len = data.t.length;
    const start = len >= 7 ? len - 7 : 0;

    const trimmed = {
      s: data.s,
      t: data.t.slice(start),
      c: data.c.slice(start)
    };

    res.json(trimmed);
  } catch (err) {
    console.error("Candle fetch error:", err);
    res.status(500).json({ error: "Failed to fetch candle data" });
  }
});




// -- Company profile + metrics
app.get("/api/company/:symbol", async (req, res) => {
  const symbol = req.params.symbol;
  try {
    const [profileResp, metricsResp] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${API_KEY}`),
      fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${API_KEY}`)
    ]);

    const profile = await profileResp.json();
    const metricsRaw = await metricsResp.json();
    const metrics = metricsRaw.metric || {};

    res.json({ profile, metrics });
  } catch (err) {
    console.error("Company fetch error:", err);
    res.status(500).json({ error: "Failed to fetch company data" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
