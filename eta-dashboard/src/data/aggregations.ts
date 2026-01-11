import type {
  EtaRecord,
  CityOverviewStats,
  TimeBucketStats,
  ComparisonFlag,
} from "../types/eta";

export function aggregateByCity(
  records: EtaRecord[]
): CityOverviewStats[] {
  const cityMap: Record<string, EtaRecord[]> = {};

  records.forEach((r) => {
    if (!cityMap[r.city]) cityMap[r.city] = [];
    cityMap[r.city].push(r);
  });

  return Object.entries(cityMap).map(([city, rows]) => {
    const total = rows.length;

    const iterations = new Set(
      rows.map((r) => r.runId)
    ).size;

    const avgEtaVariation =
      rows.reduce((sum, r) => sum + r.etaDifference, 0) /
      total;

    const pct = (flag: ComparisonFlag) =>
      Math.round(
        (rows.filter((r) => r.comparisonFlag === flag).length /
          total) *
          100
      );

    const lastBenchmarkRun = rows
      .map((r) => r.timestamp)
      .sort()
      .at(-1)!;

    return {
      city,
      totalTestCases: total,
      totalIterations: iterations,
      avgEtaVariation,
      similarPct: pct("Similar"),
      underPct: pct("Underestimate"),
      overPct: pct("Overestimate"),
      lastBenchmarkRun,
    };
  });
}

export function aggregateByTimeBucket(
  records: EtaRecord[]
): TimeBucketStats[] {
  const map: Record<string, EtaRecord[]> = {};

  records.forEach((r) => {
    if (!map[r.timeBucket]) map[r.timeBucket] = [];
    map[r.timeBucket].push(r);
  });

  return Object.entries(map).map(([bucket, rows]) => ({
    timeBucket: bucket as any,
    totalRecords: rows.length,
    similarCount: rows.filter(r => r.comparisonFlag === "Similar").length,
    underCount: rows.filter(r => r.comparisonFlag === "Underestimate").length,
    overCount: rows.filter(r => r.comparisonFlag === "Overestimate").length,
    avgEtaVariation:
      rows.reduce((s, r) => s + r.etaDifference, 0) / rows.length,
  }));
}
