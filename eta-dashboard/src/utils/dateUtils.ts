// src/utils/dateUtils.ts

/**
 * Convert RunID like 20251129_130103 → Date
 */
export function runIdToDate(runId: string): Date | null {
  if (!runId || runId.length < 15) return null;

  try {
    const year = Number(runId.slice(0, 4));
    const month = Number(runId.slice(4, 6)) - 1;
    const day = Number(runId.slice(6, 8));
    const hour = Number(runId.slice(9, 11));
    const minute = Number(runId.slice(11, 13));
    const second = Number(runId.slice(13, 15));

    return new Date(year, month, day, hour, minute, second);
  } catch {
    return null;
  }
}

/**
 * Filter records using RunID date
 */
export function filterByRunIdDate<T extends { runId: string }>(
  records: T[],
  from?: Date,
  to?: Date
): T[] {
  return records.filter((r) => {
    const d = runIdToDate(r.runId);
    if (!d) return false;
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });
}
