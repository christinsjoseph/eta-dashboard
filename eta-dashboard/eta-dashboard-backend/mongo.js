import { MongoClient } from "mongodb";

const client = new MongoClient("mongodb://localhost:27017");

export async function connectMongo() {
  await client.connect();
  console.log("✅ MongoDB connected");
  return client.db("eta_dashboard");
}
