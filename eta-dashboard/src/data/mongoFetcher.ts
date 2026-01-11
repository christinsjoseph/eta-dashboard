import type { EtaRecord } from "../types/eta";

const API_BASE = "http://localhost:4000";

/* =============================
   FETCH ETA DATA FROM MONGO
   ============================= */
export async function fetchEtaFromMongo(): Promise<EtaRecord[]> {
  const res = await fetch(`${API_BASE}/api/eta`);

  if (!res.ok) {
    throw new Error("Failed to fetch ETA data from Mongo");
  }

  const data = await res.json();

  return data as EtaRecord[];
}
