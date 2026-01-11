import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import type { EtaRecord } from "../types/eta";

type Props = {
  records: EtaRecord[];
};

export default function TrendChart({ records }: Props) {
  const grouped: Record<string, EtaRecord[]> = {};

  records.forEach(r => {
    if (!grouped[r.runId]) grouped[r.runId] = [];
    grouped[r.runId].push(r);
  });

  const data = Object.entries(grouped).map(([runId, rows]) => ({
    runId,
    avgDelta:
      rows.reduce((s, r) => s + r.etaDifference, 0) / rows.length,
  }));

  return (
    <div style={{ height: 300 }}>
      <h3>ETA Trend (Run-wise)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="runId" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="avgDelta"
            stroke="#2563EB"
            name="Avg ETA Δ"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
