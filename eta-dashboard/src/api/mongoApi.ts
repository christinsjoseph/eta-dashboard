import type { EtaRecord } from "../types/eta";

export async function fetchEtaFromMongo(params: {
  from?: string;
  to?: string;
  preset?: "7" | "30";
}): Promise<EtaRecord[]> {
  const query = new URLSearchParams(params as any).toString();

  const res = await fetch(`http://localhost:4000/api/eta?${query}`);

  if (!res.ok) {
    throw new Error("Failed to fetch Mongo data");
  }

  return res.json();
}
