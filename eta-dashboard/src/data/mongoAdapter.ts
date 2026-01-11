import type { EtaRecord } from "../types/eta";

export function normalizeMongoDocs(
  docs: any[],
  sourceName = "Mongo"
): EtaRecord[] {
  return docs.map((d) => {
    const runId = d.RunID ?? "UNKNOWN";

    return {
      runId,
      uid: String(d.UID ?? ""),
      city: d.City ?? "Unknown",

      mapplsETA: Number(d.Mappls_ETADuration ?? 0),
      googleETA: Number(d.Google_Duration ?? 0),

      etaDifference:
        Number(d.Mappls_ETADuration ?? 0) -
        Number(d.Google_Duration ?? 0),

      comparisonFlag:
        Math.abs(
          Number(d.Mappls_ETADuration ?? 0) -
            Number(d.Google_Duration ?? 0)
        ) <= 60
          ? "Similar"
          : Number(d.Mappls_ETADuration ?? 0) <
            Number(d.Google_Duration ?? 0)
          ? "Underestimate"
          : "Overestimate",
    };
  });
}
