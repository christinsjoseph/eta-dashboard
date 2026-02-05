// server.js - FINAL, CORRECT & LOGIC-ALIGNED VERSION

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URL = "mongodb://localhost:27017";
const DB_NAME = "eta_dashboard";   // ✅ ADD
const JWT_SECRET = "ETA_DASHBOARD_SECRET";



const client = new MongoClient(MONGO_URL);

await client.connect();
console.log("✅ MongoDB connected");

const db = client.db(DB_NAME);
const usersCollection = db.collection("users");
const otpCollection = db.collection("otp_store");

const transporter = nodemailer.createTransport({
  host: "smtp.yourcompany.com",     // 👈 CHANGE THIS
  port: 587,                       // Usually 587 or 465
  secure: false,
  auth: {
    user: "your-email@domain.com", // 👈 CHANGE THIS
    pass: "your-email-password",   // 👈 CHANGE THIS
  },
});


/* =============================
   CREATE INDEXES FOR PERFORMANCE
   ============================= */
async function createIndexes() {
  try {
    const collections = await db.listCollections().toArray();

    for (const c of collections) {
      if (!c.name.startsWith("eta_")) continue;

      const col = db.collection(c.name);
      await col.createIndex({ RunID: 1 });
      await col.createIndex({ City: 1 });
      await col.createIndex({ RunID: 1, City: 1 });
    }

    console.log("✅ Database indexes created/verified");
  } catch (err) {
    console.log("⚠️ Index creation skipped", err.message);
  }
}

await createIndexes();

/* =============================
   HELPERS
   ============================= */

// IMPORTANT: All comparisons use Duration fields (NOT ETADuration)
function calculateComparisonFlag(predicted, google, threshold = 10) {
  if (!google || google === 0) return "Similar";
  if (!predicted || predicted === 0) return "Similar";

  const variation = (1 - predicted / google) * 100;

  if (variation > threshold) return "Underestimate";
  if (variation < -threshold) return "Overestimate";
  return "Similar";
}

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

/* =============================
   AUTHENTICATION APIs
   ============================= */

// CREATE USER
app.post("/api/auth/create", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const existing = await usersCollection.findOne({ email });

    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await usersCollection.insertOne({
      email,
      password: hashedPassword,
      name,
      createdAt: new Date()
    });

    res.json({ message: "User created successfully" });

  } catch (err) {
    res.status(500).json({ message: "Error creating user" });
  }
});


// LOGIN API
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await usersCollection.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { email: user.email, id: user._id },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        email: user.email,
        name: user.name
      }
    });

  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
});
function authMiddleware(req, res, next) {
  const header = req.headers["authorization"];

  if (!header) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}
app.post("/api/auth/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    const existingUser = await usersCollection.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await otpCollection.deleteMany({ email });

    await otpCollection.insertOne({
      email,
      otp,
      createdAt: new Date(),
    });

    await transporter.sendMail({
      from: "your-email@domain.com",
      to: email,
      subject: "ETA Dashboard OTP Verification",
      html: `
        <h2>Your OTP Code</h2>
        <p>Use this OTP to verify your email:</p>
        <h1>${otp}</h1>
        <p>This OTP is valid for 10 minutes.</p>
      `,
    });

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to send OTP" });
  }
});
import { sendOtpEmail } from "./utils/otpService.js";

app.post("/api/auth/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    const otp = Math.floor(100000 + Math.random() * 900000);

    await otpCollection.insertOne({
      email,
      otp,
      createdAt: new Date(),
    });

    await sendOtpEmail(email, otp);

    res.json({ message: "OTP sent successfully" });

  } catch (err) {
    res.status(500).json({ message: "Failed to send OTP" });
  }
});
app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { email, otp, name, password } = req.body;

    const record = await otpCollection.findOne({ email, otp: Number(otp) });

    if (!record) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await usersCollection.insertOne({
      email,
      name,
      password: hashedPassword,
      createdAt: new Date(),
    });

    await otpCollection.deleteMany({ email });

    res.json({ message: "User created successfully" });

  } catch (err) {
    res.status(500).json({ message: "Verification failed" });
  }
});

/* =============================
   API: FETCH ETA DATA
   ============================= */
app.post("/api/eta", authMiddleware, async (req, res) => {

  try {
    const {
  fromRunId,
  toRunId,
  collectionName,
  mode = "full",
  limit = 10000,
  page = 1
} = req.body;

if (!collectionName) {
  return res.status(400).json({ error: "collectionName is required" });
}

const collection = db.collection(collectionName);

    const startTime = Date.now();

    const matchQuery = {};
    if (fromRunId && toRunId) {
      matchQuery.RunID = { $gte: fromRunId, $lte: toRunId };
    }

    /* =============================
       AGGREGATED MODE
       ============================= */
    if (mode === "aggregated") {
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
                            { $subtract: ["$Mappls_Duration", "$Google_Duration"] },
                            "$Google_Duration"
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

            mapplsOver: {
              $sum: {
                $cond: [
                  {
                    $lt: [
                      {
                        $divide: [
                          { $subtract: ["$Mappls_Duration", "$Google_Duration"] },
                          "$Google_Duration"
                        ]
                      },
                      -0.1
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
                            { $subtract: ["$Oauth2_RouteDuration", "$Google_Duration"] },
                            "$Google_Duration"
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
                    $lt: [
                      {
                        $divide: [
                          { $subtract: ["$Oauth2_RouteDuration", "$Google_Duration"] },
                          "$Google_Duration"
                        ]
                      },
                      -0.1
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

      return res.json({
        collectionName,
        mode: "aggregated",
        cityStats,
        totalRecords: cityStats.reduce((s, c) => s + c.totalOrders, 0),
        queryTime: Date.now() - startTime
      });
    }

    /* =============================
       FULL MODE
       ============================= */
    const total = await collection.countDocuments(matchQuery);

    const docs = await collection
      .find(matchQuery)
      .project({
        RunID: 1,
        Day: 1,
        City: 1,
        UID: 1,
        Mappls_Duration: 1,
        Google_Duration: 1,
        Oauth2_RouteDuration: 1
      })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const data = docs.map(d => {
      const mapplsETA = Number(d.Mappls_Duration ?? 0);
      const googleETA = Number(d.Google_Duration ?? 0);
      const oauth2ETA = Number(d.Oauth2_RouteDuration ?? 0);

      return {
        ...d,
        runId: d.RunID,
        uid: String(d.UID),
        city: d.City || "Unknown",
        mapplsETA,
        googleETA,
        oauth2ETA,
        mapplsComparisonFlag: calculateComparisonFlag(mapplsETA, googleETA),
        oauth2ComparisonFlag: calculateComparisonFlag(oauth2ETA, googleETA),
        mapplsDifference: mapplsETA - googleETA,
        oauth2Difference: oauth2ETA - googleETA,
        comparisonFlag: calculateComparisonFlag(mapplsETA, googleETA),
        etaDifference: mapplsETA - googleETA,
        timeBucket: deriveTimeBucket(d.RunID)
      };
    });

    res.json({
      collectionName,
      mode: "full",
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      },
      queryTime: Date.now() - startTime
    });

  } catch (err) {
    console.error("❌ /api/eta failed:", err);
    res.status(500).json({
      collectionName,
      data: [],
      error: err.message
    });
  }
});

/* =============================
   API: AVERAGE VARIATION (CORRECT)
   ============================= */
app.post("/api/eta/average-variation", authMiddleware, async (req, res) => {

  try {
    const { fromRunId, toRunId } = req.body;
    const startTime = Date.now();

    const matchQuery = {
      Google_Duration: { $gt: 0 },
      Mappls_Duration: { $gt: 0 },
      Oauth2_RouteDuration: { $gt: 0 }
    };

    if (fromRunId && toRunId) {
      matchQuery.RunID = { $gte: fromRunId, $lte: toRunId };
    }

    const pipeline = [
      { $match: matchQuery },
      {
        $project: {
          mapplsVariation: {
            $multiply: [
              { $subtract: [1, { $divide: ["$Mappls_Duration", "$Google_Duration"] }] },
              100
            ]
          },
          oauth2Variation: {
            $multiply: [
              { $subtract: [1, { $divide: ["$Oauth2_RouteDuration", "$Google_Duration"] }] },
              100
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgMapplsVariation: { $avg: "$mapplsVariation" },
          avgOauth2Variation: { $avg: "$oauth2Variation" },
          totalRecords: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          Mappls_Duration_vs_Google_Duration_percentage: {
            $round: ["$avgMapplsVariation", 2]
          },
          Oauth2_RouteDuration_vs_Google_Duration_percentage: {
            $round: ["$avgOauth2Variation", 2]
          },
          totalRecords: 1
        }
      }
    ];

    const [result] = await collection.aggregate(pipeline).toArray();

    res.json({
      collectionName,
      mode: "average-variation",
      data: result || {
        Mappls_Duration_vs_Google_Duration_percentage: 0,
        Oauth2_RouteDuration_vs_Google_Duration_percentage: 0,
        totalRecords: 0
      },
      queryTime: Date.now() - startTime
    });

  } catch (err) {
    console.error("❌ /api/eta/average-variation failed:", err);
    res.status(500).json({
      collectionName,
      data: {},
      error: err.message
    });
  }
});

/* =============================
   START SERVER
   ============================= */
const PORT = 4000;
/* =============================
   API: LIST ETA COLLECTIONS
   ============================= */
app.get("/api/eta/collections", async (req, res) => {
  try {
    const collections = await db.listCollections().toArray();

    const etaCollections = collections
      .map(c => c.name)
      .filter(name => name.startsWith("eta_"));

    res.json({
      collections: etaCollections
    });
  } catch (err) {
    console.error("❌ /api/eta/collections failed:", err);
    res.status(500).json({ collections: [] });
  }
});
/* =============================
   API: COLLECTION DATE RANGE
   ============================= */
app.get("/api/eta/collection-range", async (req, res) => {
  try {
    const { collectionName } = req.query;

    if (!collectionName) {
      return res.status(400).json({ error: "collectionName is required" });
    }

    const collection = db.collection(collectionName);

    const [result] = await collection.aggregate([
      {
        $project: {
          runDate: { $substr: ["$RunID", 0, 8] } // YYYYMMDD
        }
      },
      {
        $group: {
          _id: null,
          minDate: { $min: "$runDate" },
          maxDate: { $max: "$runDate" }
        }
      }
    ]).toArray();

    if (!result) {
      return res.json({ minDate: null, maxDate: null });
    }

    const format = (d) =>
      `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;

    res.json({
      minDate: format(result.minDate),
      maxDate: format(result.maxDate)
    });
  } catch (err) {
    console.error("❌ /api/eta/collection-range failed:", err);
    res.status(500).json({ minDate: null, maxDate: null });
  }
});

app.listen(4000, "0.0.0.0", () => {
  console.log("🚀 Backend running on http://0.0.0.0:4000");
});
