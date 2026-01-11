// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

/* =============================
   APP SETUP
   ============================= */
const app = express();
app.use(cors());
app.use(express.json());

/* =============================
   MONGO CONFIG
   ============================= */
const MONGO_URL = "mongodb://localhost:27017";
const DB_NAME = "eta_dashboard";
const COLLECTION = "eta_records";

const client = new MongoClient(MONGO_URL);

/* =============================
   CONNECT MONGO
   ============================= */
await client.connect();
console.log("✅ MongoDB connected");

const db = client.db(DB_NAME);
const collection = db.collection(COLLECTION);

/* =============================
   HELPERS
   ============================= */
function deriveTimeBucket(runId) {
  if (!runId) return "Midnight";

  const timePart = runId.split("_")[1]; // HHMMSS
  if (!timePart) return "Midnight";

  const hour = Number(timePart.slice(0, 2));

  if (hour >= 6 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 16) return "Afternoon";
  if (hour >= 16 && hour < 22) return "Evening";
  return "Midnight";
}

/**
 * Calculate comparison flag based on percentage difference
 * Tells us if Mappls/Oauth2 is overestimating or underestimating compared to Google
 * @param {number} predicted - Predicted ETA (Mappls or Oauth2)
 * @param {number} google - Google ETA baseline
 * @param {number} threshold - Percentage threshold (default 10%)
 * @returns {string} - "Similar", "Overestimate", or "Underestimate"
 */
function calculateComparisonFlag(predicted, google, threshold = 10) {
  // Handle edge cases
  if (google === 0 || !google) return "Similar";
  if (predicted === 0 || !predicted) return "Similar";
  
  // Calculate percentage difference
  const percentDiff = ((predicted - google) / google) * 100;
  
  // Within threshold = Similar
  if (Math.abs(percentDiff) <= threshold) {
    return "Similar";
  }
  
  // Predicted MORE time than Google = OVERESTIMATE (predicting trip will take longer)
  if (percentDiff > threshold) {
    return "Overestimate";
  }
  
  // Predicted LESS time than Google = UNDERESTIMATE (predicting trip will be shorter)
  return "Underestimate";
}

/* =============================
   API: FETCH ETA DATA
   ============================= */
app.post("/api/eta", async (req, res) => {
  try {
    const { fromRunId, toRunId } = req.body;

    const query = {};
    if (fromRunId && toRunId) {
      query.RunID = {
        $gte: fromRunId,
        $lte: toRunId,
      };
    }

    const docs = await collection.find(query).toArray();

    console.log("\n========== DEBUG INFO ==========");
    console.log("Total documents:", docs.length);
    
    if (docs.length > 0) {
      const firstDoc = docs[0];
      console.log("\nFirst document raw values:");
      console.log("- Mappls_ETADuration:", firstDoc.Mappls_ETADuration);
      console.log("- Mappls_Duration:", firstDoc.Mappls_Duration);
      console.log("- Google_Duration:", firstDoc.Google_Duration);
      console.log("- Oauth2_ETADuration:", firstDoc.Oauth2_ETADuration);
      console.log("- Oauth2_RouteDuration:", firstDoc.Oauth2_RouteDuration);
    }

    const transformed = docs.map((d) => {
      // Extract duration values
      const mapplsETA = Number(d.Mappls_ETADuration ?? d.Mappls_Duration ?? 0);
      const googleETA = Number(d.Google_Duration ?? 0);
      const oauth2ETA = Number(d.Oauth2_ETADuration ?? d.Oauth2_RouteDuration ?? 0);

      // Calculate comparison flags for BOTH services
      const mapplsComparisonFlag = calculateComparisonFlag(mapplsETA, googleETA);
      const oauth2ComparisonFlag = calculateComparisonFlag(oauth2ETA, googleETA);

      // Calculate differences
      const mapplsDifference = mapplsETA - googleETA;
      const oauth2Difference = oauth2ETA - googleETA;

      return {
        /* =============================
           RAW MONGO FIELDS (PASSTHROUGH)
           ============================= */
        _id: d._id,
        RunID: d.RunID,
        Day: d.Day,
        City: d.City,
        UID: d.UID,

        Mappls_Distance: d.Mappls_Distance,
        Mappls_Duration: d.Mappls_Duration,
        Mappls_BaseDuration: d["Mappls BaseDuration"],
        Mappls_ETADuration: d.Mappls_ETADuration,
        Mappls_Geom: d.Mappls_Geom,
        Mappls_Server: d["Mappls Server"],

        Google_Distance: d.Google_Distance,
        Google_Duration: d.Google_Duration,
        Google_Geom: d.Google_Geom,

        Oauth2_RouteDistance: d.Oauth2_RouteDistance,
        Oauth2_RouteDuration: d.Oauth2_RouteDuration,
        Oauth2_server: d.Oauth2_server,
        Oauth2_baseDuration: d.Oauth2_baseDuration,
        Oauth2_ETADuration: d.Oauth2_ETADuration,

        TrafficDelay: d.TrafficDelay,
        SignalDelay: d.SignalDelay,

        /* =============================
           NORMALIZED FIELDS (FOR UI)
           ============================= */
        runId: d.RunID,
        uid: String(d.UID),
        city: d.City || "Unknown",

        // Duration values (for display)
        mapplsETA,
        googleETA,
        oauth2ETA,

        // Mappls vs Google comparison
        mapplsComparisonFlag,
        mapplsDifference,

        // Oauth2 vs Google comparison
        oauth2ComparisonFlag,
        oauth2Difference,

        // Legacy fields (for backward compatibility - defaults to Mappls)
        comparisonFlag: mapplsComparisonFlag,
        etaDifference: mapplsDifference,

        timeBucket: deriveTimeBucket(d.RunID),
      };
    });

    if (transformed.length > 0) {
      console.log("\nFirst transformed document:");
      console.log("- mapplsETA:", transformed[0].mapplsETA);
      console.log("- googleETA:", transformed[0].googleETA);
      console.log("- oauth2ETA:", transformed[0].oauth2ETA);
      console.log("- mapplsComparisonFlag:", transformed[0].mapplsComparisonFlag);
      console.log("- oauth2ComparisonFlag:", transformed[0].oauth2ComparisonFlag);
      console.log("- mapplsDifference:", transformed[0].mapplsDifference);
      console.log("- oauth2Difference:", transformed[0].oauth2Difference);
    }
    console.log("================================\n");

    // Return response with collection name
    res.json({
      collectionName: COLLECTION,
      data: transformed
    });
  } catch (err) {
    console.error("❌ /api/eta failed:", err);
    res.status(500).json({
      collectionName: COLLECTION,
      data: []
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