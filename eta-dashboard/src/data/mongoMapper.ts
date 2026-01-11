import type { EtaRecord, ComparisonFlag } from "../types/eta";

/* =============================
   FLAG LOGIC
   ============================= */
function getComparisonFlag(
  mapplsETA: number,
  googleETA: number
): ComparisonFlag {
  const diff = mapplsETA - googleETA;

  if (Math.abs(diff) <= 60) return "Similar";
  if (diff < 0) return "Underestimate";
  return "Overestimate";
}

/* =============================
   RUNID → TIMESTAMP (OPTIONAL)
   ============================= */
function runIdToISO(runId: string): string {
  // 20251129_130103 → 2025-11-29T13:01:03
  const [date, time] = runId.split("_");
  return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T${time.slice(0, 2)}:${time.slice(2, 4)}:${time.slice(4, 6)}`;
}

/* =============================
   MAIN MAPPER
   ============================= */
export function mapMongoToEtaRecord(doc: any): EtaRecord {
  const mapplsETA = Number(doc.Mappls_ETADuration);
  const googleETA = Number(doc.Google_Duration);

  return {
    runId: doc.RunID,
    uid: String(doc.UID),
    city: doc.City ?? "Unknown",

    mapplsETA,
    googleETA,

    etaDifference: mapplsETA - googleETA,
    comparisonFlag: getComparisonFlag(mapplsETA, googleETA),

    // optional but future-proof
    timestamp: runIdToISO(doc.RunID),
  };
}
