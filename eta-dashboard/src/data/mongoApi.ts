import type { EtaRecord } from "../types/eta";

/**
 * MOCK Mongo fetch
 * Replace with real API later
 */
export async function fetchEtaFromMongo(params: {
  from?: string;
  to?: string;
  preset?: "LAST_7_DAYS" | "LAST_30_DAYS";
}): Promise<EtaRecord[]> {
  console.log("📡 Mongo import params:", params);

  // simulate network delay
  await new Promise(res => setTimeout(res, 800));

  // TEMP: return empty array
  // Later → return real Mongo data
  return [];
}
