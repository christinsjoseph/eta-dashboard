import express from "express";
import { getDb } from "../mongo.js";

const router = express.Router();

/* -----------------------------
   Resolve date filters
----------------------------- */
function resolveDateRange(body) {
  const now = new Date();

  if (body.preset === "LAST_7_DAYS") {
    return {
      from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      to: now,
    };
  }

  if (body.preset === "LAST_30_DAYS") {
    return {
      from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      to: now,
    };
  }

  return {
    from: new Date(body.fromDate),
    to: new Date(body.toDate),
  };
}

/* -----------------------------
   IMPORT ETA DATA
----------------------------- */
router.post("/import", async (req, res) => {
  try {
    const db = await getDb();
    const { from, to } = resolveDateRange(req.body);

    const pipeline = [
      {
        $match: {
          runTimestamp: { $gte: from, $lte: to },
        },
      },
      {
        $lookup: {
          from: "test_cases_master",
          localField: "uid",
          foreignField: "uid",
          as: "testCase",
        },
      },
      { $unwind: "$testCase" },
      {
        $project: {
          uid: 1,
          runId: 1,
          timestamp: "$runTimestamp",
          timeBucket: 1,
          comparisonFlag: 1,
          etaDifference: 1,
          city: "$testCase.city",
          mapplsETA: "$metrics.providerA.etaDuration",
          googleETA: "$metrics.providerB.duration",
        },
      },
    ];

    const records = await db
      .collection("eta_runs")
      .aggregate(pipeline)
      .toArray();

    res.json({
      source: "mongo",
      records,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Mongo import failed" });
  }
});

export default router;
