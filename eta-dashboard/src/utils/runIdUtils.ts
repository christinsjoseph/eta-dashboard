// src/utils/runIdUtils.ts
export function dateToRunId(date: Date, endOfDay = false) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  const h = endOfDay ? "23" : "00";
  const min = endOfDay ? "59" : "00";
  const s = endOfDay ? "59" : "00";

  return `${y}${m}${d}_${h}${min}${s}`;
}
