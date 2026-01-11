import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || "";
const client = new MongoClient(uri);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { fromDate, toDate } = req.body;

  if (!fromDate || !toDate) return res.status(400).json({ error: "Date range required" });

  try {
    await client.connect();
    const db = client.db("eta_dashboard"); // Change to your DB name
    const collection = db.collection("eta_records"); // Change to your collection

    const start = new Date(fromDate);
    const end = new Date(toDate);
    end.setHours(23, 59, 59, 999);

    const records = await collection
      .find({ timestamp: { $gte: start, $lte: end } })
      .toArray();

    res.status(200).json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.close();
  }
}