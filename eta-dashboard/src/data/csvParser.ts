// src/data/csvParser.ts
import Papa from "papaparse";
import type { EtaRecord, ComparisonFlag } from "../types/eta";

/* =============================
   COMPARISON FLAG LOGIC
============================= */
function getComparisonFlag(diff: number): ComparisonFlag {
  if (Math.abs(diff) <= 60) return "Similar";
  return diff > 0 ? "Overestimate" : "Underestimate";
}

/* =============================
   CSV → ETA RECORDS (INGESTION)
============================= */
export function parseEtaCsv(
  file: File,
  callback: (records: EtaRecord[]) => void
) {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      const rows = results.data as any[];

      /* ------------------------------------------------
         🔥 DATA CLEANING (OAuth2 is MANDATORY)
         Keep ONLY rows where ALL durations are valid (> 0)
      ------------------------------------------------ */
      const cleanRows = rows.filter((r) => {
        const mapplsETA = Number(
          r["Mappls_ETADuration"] ?? r["Mappls Duration"]
        );
        const googleETA = Number(r["Google_Duration"]);
        const oauth2Duration = Number(r["Oauth2_RouteDuration"]);

        return (
          Number.isFinite(mapplsETA) && mapplsETA > 0 &&
          Number.isFinite(googleETA) && googleETA > 0 &&
          Number.isFinite(oauth2Duration) && oauth2Duration > 0
        );
      });

      /* ------------------------------------------------
         MAP CLEAN ROWS → EtaRecord
      ------------------------------------------------ */
      const records: EtaRecord[] = cleanRows.map((r) => {
        const mapplsETA = Number(
          r["Mappls_ETADuration"] ?? r["Mappls Duration"]
        );
        const googleETA = Number(r["Google_Duration"]);
        const oauth2Duration = Number(r["Oauth2_RouteDuration"]);

        const diff = mapplsETA - googleETA;

        return {
          runId: String(r["RunID"]),
          uid: String(r["UID"]),
          city: r["City"] ?? "Unknown",

          mapplsETA,
          googleETA,
          oauth2RouteDuration: oauth2Duration,

          etaDifference: diff,
          comparisonFlag: getComparisonFlag(diff),

          /* 🔑 SOURCE METADATA */
          sourceType: "CSV",
          sourceName: file.name,
        };
      });

      callback(records);
    },
  });
}
