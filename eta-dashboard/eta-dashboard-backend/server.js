// server.js - OPTIMIZED VERSION
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URL = "mongodb://localhost:27017";
const DB_NAME = "eta_dashboard";
const COLLECTION = "eta_records";

const client = new MongoClient(MONGO_URL);

await client.connect();
console.log("✅ MongoDB connected");

const db = client.db(DB_NAME);
const collection = db.collection(COLLECTION);

/* =============================
   CREATE INDEXES FOR PERFORMANCE
   ============================= */
async function createIndexes() {
  try {
    await collection.createIndex({ RunID: 1 });
    await collection.createIndex({ City: 1 });
    await collection.createIndex({ RunID: 1, City: 1 });
    console.log("✅ Database indexes created/verified");
  } catch (err) {
    console.log("⚠️  Index creation skipped (may already exist)");
  }
}
await createIndexes();

/* =============================
   HELPERS
   ============================= */
function deriveTimeBucket(runId) {
  if (!runId) return "Midnight";
  const timePart = runId.split("_")[1];
  if (!timePart) return "Midnight";
  const hour = Number(timePart.slice(0, 2));
  if (hour >= 6 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 16) return "Afternoon";
  if (hour >= 16 && hour < 22) return "Evening";
  return "Midnight";
}

function calculateComparisonFlag(predicted, google, threshold = 10) {
  if (google === 0 || !google) return "Similar";
  if (predicted === 0 || !predicted) return "Similar";
  const percentDiff = ((predicted - google) / google) * 100;
  if (Math.abs(percentDiff) <= threshold) return "Similar";
  if (percentDiff > threshold) return "Overestimate";
  return "Underestimate";
}

/* =============================
   OPTIMIZED API: FETCH ETA DATA
   ============================= */
app.post("/api/eta", async (req, res) => {
  try {
    const { fromRunId, toRunId, mode = "full", limit = 10000, page = 1 } = req.body;
    
    const startTime = Date.now();

    const matchQuery = {};
    if (fromRunId && toRunId) {
      matchQuery.RunID = { $gte: fromRunId, $lte: toRunId };
    }

    // SUPER FAST AGGREGATION MODE
    if (mode === "aggregated") {
      console.log("📊 Fetching AGGREGATED data using pipeline...");
      
      const pipeline = [
        { $match: matchQuery },
        {
          $group: {
            _id: "$City",
            totalOrders: { $sum: 1 },
            mapplsSimilar: {
              $sum: {
                $cond: [
                  {
                    $lte: [
                      {
                        $abs: {
                          $divide: [
                            { $subtract: [
                              { $ifNull: ["$Mappls_ETADuration", { $ifNull: ["$Mappls_Duration", 0] }] },
                              { $ifNull: ["$Google_Duration", 0] }
                            ]},
                            { $cond: [{ $eq: ["$Google_Duration", 0] }, 1, "$Google_Duration"] }
                          ]
                        }
                      },
                      0.1 // 10% threshold
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            mapplsOver: {
              $sum: {
                $cond: [
                  {
                    $gt: [
                      {
                        $divide: [
                          { $subtract: [
                            { $ifNull: ["$Mappls_ETADuration", { $ifNull: ["$Mappls_Duration", 0] }] },
                            { $ifNull: ["$Google_Duration", 0] }
                          ]},
                          { $cond: [{ $eq: ["$Google_Duration", 0] }, 1, "$Google_Duration"] }
                        ]
                      },
                      0.1
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            oauth2Similar: {
              $sum: {
                $cond: [
                  {
                    $lte: [
                      {
                        $abs: {
                          $divide: [
                            { $subtract: [
                              { $ifNull: ["$Oauth2_ETADuration", { $ifNull: ["$Oauth2_RouteDuration", 0] }] },
                              { $ifNull: ["$Google_Duration", 0] }
                            ]},
                            { $cond: [{ $eq: ["$Google_Duration", 0] }, 1, "$Google_Duration"] }
                          ]
                        }
                      },
                      0.1
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            oauth2Over: {
              $sum: {
                $cond: [
                  {
                    $gt: [
                      {
                        $divide: [
                          { $subtract: [
                            { $ifNull: ["$Oauth2_ETADuration", { $ifNull: ["$Oauth2_RouteDuration", 0] }] },
                            { $ifNull: ["$Google_Duration", 0] }
                          ]},
                          { $cond: [{ $eq: ["$Google_Duration", 0] }, 1, "$Google_Duration"] }
                        ]
                      },
                      0.1
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        },
        { $sort: { _id: 1 } }
      ];

      const results = await collection.aggregate(pipeline).toArray();
      
      const cityStats = results.map(r => ({
        city: r._id || "Unknown",
        totalOrders: r.totalOrders,
        mappls: {
          similarCount: r.mapplsSimilar,
          overCount: r.mapplsOver,
          underCount: r.totalOrders - r.mapplsSimilar - r.mapplsOver
        },
        oauth2: {
          similarCount: r.oauth2Similar,
          overCount: r.oauth2Over,
          underCount: r.totalOrders - r.oauth2Similar - r.oauth2Over
        }
      }));

      const elapsed = Date.now() - startTime;
      console.log(`✅ Aggregated ${cityStats.length} cities in ${elapsed}ms`);

      return res.json({
        collectionName: COLLECTION,
        mode: "aggregated",
        cityStats,
        totalRecords: cityStats.reduce((sum, c) => sum + c.totalOrders, 0),
        queryTime: elapsed
      });
    }

    // OPTIMIZED FULL DATA MODE
    console.log(`📄 Fetching FULL data (page ${page}, limit ${limit})...`);

    const total = await collection.countDocuments(matchQuery);
    
    // Use projection to only include fields we need (automatically excludes everything else including geometry)
    const docs = await collection
      .find(matchQuery)
      .project({
        RunID: 1,
        Day: 1,
        City: 1,
        UID: 1,
        Mappls_Distance: 1,
        Mappls_Duration: 1,
        "Mappls BaseDuration": 1,
        Mappls_ETADuration: 1,
        "Mappls Server": 1,
        Google_Distance: 1,
        Google_Duration: 1,
        Oauth2_RouteDistance: 1,
        Oauth2_RouteDuration: 1,
        Oauth2_server: 1,
        Oauth2_baseDuration: 1,
        Oauth2_ETADuration: 1,
        TrafficDelay: 1,
        SignalDelay: 1
      })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const transformed = docs.map((d) => {
      const mapplsETA = Number(d.Mappls_ETADuration ?? d.Mappls_Duration ?? 0);
      const googleETA = Number(d.Google_Duration ?? 0);
      const oauth2ETA = Number(d.Oauth2_ETADuration ?? d.Oauth2_RouteDuration ?? 0);

      const mapplsComparisonFlag = calculateComparisonFlag(mapplsETA, googleETA);
      const oauth2ComparisonFlag = calculateComparisonFlag(oauth2ETA, googleETA);

      return {
        _id: d._id,
        RunID: d.RunID,
        Day: d.Day,
        City: d.City,
        UID: d.UID,
        Mappls_Distance: d.Mappls_Distance,
        Mappls_Duration: d.Mappls_Duration,
        Mappls_BaseDuration: d["Mappls BaseDuration"],
        Mappls_ETADuration: d.Mappls_ETADuration,
        Mappls_Server: d["Mappls Server"],
        Google_Distance: d.Google_Distance,
        Google_Duration: d.Google_Duration,
        Oauth2_RouteDistance: d.Oauth2_RouteDistance,
        Oauth2_RouteDuration: d.Oauth2_RouteDuration,
        Oauth2_server: d.Oauth2_server,
        Oauth2_baseDuration: d.Oauth2_baseDuration,
        Oauth2_ETADuration: d.Oauth2_ETADuration,
        TrafficDelay: d.TrafficDelay,
        SignalDelay: d.SignalDelay,
        runId: d.RunID,
        uid: String(d.UID),
        city: d.City || "Unknown",
        mapplsETA,
        googleETA,
        oauth2ETA,
        mapplsComparisonFlag,
        mapplsDifference: mapplsETA - googleETA,
        oauth2ComparisonFlag,
        oauth2Difference: oauth2ETA - googleETA,
        comparisonFlag: mapplsComparisonFlag,
        etaDifference: mapplsETA - googleETA,
        timeBucket: deriveTimeBucket(d.RunID),
      };
    });

    const elapsed = Date.now() - startTime;
    console.log(`✅ Fetched ${docs.length} records in ${elapsed}ms`);

    res.json({
      collectionName: COLLECTION,
      mode: "full",
      data: transformed,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      },
      queryTime: elapsed
    });
  } catch (err) {
    console.error("❌ /api/eta failed:", err);
    res.status(500).json({
      collectionName: COLLECTION,
      data: [],
      error: err.message
    });
  }
});

/* =============================
   API: FETCH CITY DETAILS (OPTIMIZED)
   ============================= */
app.post("/api/eta/city", async (req, res) => {
  try {
    const { fromRunId, toRunId, city } = req.body;
    
    const startTime = Date.now();

    const query = { City: city };
    if (fromRunId && toRunId) {
      query.RunID = {
        $gte: fromRunId,
        $lte: toRunId,
      };
    }

    console.log(`🏙️  Fetching data for city: ${city}`);

    const docs = await collection.find(query).project({
      RunID: 1,
      Day: 1,
      City: 1,
      UID: 1,
      Mappls_ETADuration: 1,
      Mappls_Duration: 1,
      Google_Duration: 1,
      Oauth2_ETADuration: 1,
      Oauth2_RouteDuration: 1
    }).toArray();

    const transformed = docs.map((d) => {
      const mapplsETA = Number(d.Mappls_ETADuration ?? d.Mappls_Duration ?? 0);
      const googleETA = Number(d.Google_Duration ?? 0);
      const oauth2ETA = Number(d.Oauth2_ETADuration ?? d.Oauth2_RouteDuration ?? 0);

      const mapplsComparisonFlag = calculateComparisonFlag(mapplsETA, googleETA);
      const oauth2ComparisonFlag = calculateComparisonFlag(oauth2ETA, googleETA);

      const mapplsDifference = mapplsETA - googleETA;
      const oauth2Difference = oauth2ETA - googleETA;

      return {
        _id: d._id,
        RunID: d.RunID,
        Day: d.Day,
        City: d.City,
        UID: d.UID,
        runId: d.RunID,
        uid: String(d.UID),
        city: d.City || "Unknown",
        mapplsETA,
        googleETA,
        oauth2ETA,
        mapplsComparisonFlag,
        mapplsDifference,
        oauth2ComparisonFlag,
        oauth2Difference,
        comparisonFlag: mapplsComparisonFlag,
        etaDifference: mapplsDifference,
        timeBucket: deriveTimeBucket(d.RunID),
      };
    });

    const elapsed = Date.now() - startTime;
    console.log(`✅ Found ${transformed.length} records for ${city} in ${elapsed}ms`);

    res.json({
      collectionName: COLLECTION,
      city,
      data: transformed,
      queryTime: elapsed
    });
  } catch (err) {
    console.error("❌ /api/eta/city failed:", err);
    res.status(500).json({
      collectionName: COLLECTION,
      data: [],
      error: err.message
    });
  }
});

/* =============================
   START SERVER
   ============================= */
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});