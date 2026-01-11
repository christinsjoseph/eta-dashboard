import express from "express";
import { db } from "../mongo.js";

const router = express.Router();

/**
 * GET /eta/import
 * Query params:
 *  - from (ISO date)
 *  - to (ISO date)
 */
router.get("/import", async (req, res) => {
  try {
    const { from, to } = req.query;

    const query = {};

    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = new Date(from);
      if (to) query.timestamp.$lte = new Date(to);
    }

    const records = await db
      .collection("eta_records")
      .find(query)
      .sort({ timestamp: 1 })
      .toArray();

    res.json({
      source: "mongo",
      count: records.length,
      records,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch ETA data" });
  }
});

export default router;
