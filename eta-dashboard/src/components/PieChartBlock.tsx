import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { EtaRecord } from "../types/eta";

const COLORS = ["#10b981", "#ef4444", "#f59e0b"];

export default function PieChartBlock({
  records,
}: {
  records: EtaRecord[];
}) {
  const data = [
    {
      name: "Similar",
      value: records.filter(r => r.comparisonFlag === "Similar").length,
    },
    {
      name: "Underestimate",
      value: records.filter(r => r.comparisonFlag === "Underestimate").length,
    },
    {
      name: "Overestimate",
      value: records.filter(r => r.comparisonFlag === "Overestimate").length,
    },
  ].filter(item => item.value > 0);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Custom label positioned OUTSIDE the pie
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 15; // Distance outside the pie
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    const percentage = total > 0 ? Math.round(percent * 100) : 0;

    return (
      <text
        x={x}
        y={y}
        fill="#374151"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize="14"
        fontWeight="600"
      >
        {percentage}%
      </text>
    );
  };

  return (
    <div style={{ height: 380, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          {/* Subtle 3D shadow */}
          <defs>
            <filter id="pieShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="6" />
              <feOffset dx="0" dy="8" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.4" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={0}
            outerRadius={110}
            paddingAngle={5}
            cornerRadius={10}
            dataKey="value"
            nameKey="name"
            filter="url(#pieShadow)"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth={2}
            label={renderCustomizedLabel}  // Labels now outside
            labelLine={false}  // Connecting lines to show which slice
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>

          <Tooltip
            contentStyle={{
              background: "rgba(255,255,255,0.95)",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.7)",
              boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
              color: "#111827",
              fontSize: "14px",
              padding: "12px",
            }}
            formatter={(value: number, name: string) => [`${value} records`, name]}
          />

          {/* Legend at bottom */}
          <Legend
            verticalAlign="bottom"
            height={120}
            iconSize={14}
            iconType="circle"
            layout="horizontal"
            align="center"
            wrapperStyle={{
              fontSize: "14px",
              color: "#374151",
              fontWeight: "500",
              paddingTop: "10px",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}