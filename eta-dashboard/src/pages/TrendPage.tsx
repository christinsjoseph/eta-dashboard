import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { EtaRecord } from "../types/eta";

type Props = {
  city: string;
  records: EtaRecord[];
};

export default function TrendPage({ city, records }: Props) {
  const trendData = useMemo(() => {
    const map: Record<string, EtaRecord[]> = {};

    records.forEach((r) => {
      if (!map[r.runId]) map[r.runId] = [];
      map[r.runId].push(r);
    });

    return Object.entries(map)
      .map(([runId, rows]) => ({
        runId,
        timestamp: rows[0].timestamp,
        avgEtaDiff:
          rows.reduce((s, r) => s + r.etaDifference, 0) /
          rows.length,
      }))
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() -
          new Date(b.timestamp).getTime()
      );
  }, [records]);

  return (
    <div style={{ height: 320 }}>
      <h3>ETA Trend Over Runs – {city}</h3>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={trendData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="runId" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="avgEtaDiff"
            stroke="#F59E0B"
            dot
            name="Avg ETA Difference"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
