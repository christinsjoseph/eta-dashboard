import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useMemo } from "react";
import type { EtaRecord, ComparisonFlag } from "../types/eta";

const COLORS: Record<ComparisonFlag, string> = {
  Similar: "#10b981",
  Underestimate: "#ef4444",
  Overestimate: "#f59e0b",
};

export default function PieChartBlock({
  records,
  comparison,
}: {
  records: EtaRecord[];
  comparison: "mappls" | "oauth2";
}) {
  const data = useMemo(() => {
    let similar = 0;
    let under = 0;
    let over = 0;

    records.forEach((r) => {
      const flag =
        comparison === "mappls"
          ? r.mapplsComparisonFlag
          : r.oauth2ComparisonFlag;

      if (flag === "Similar") similar++;
      else if (flag === "Underestimate") under++;
      else if (flag === "Overestimate") over++;
    });

    return [
      { name: "Similar", value: similar },
      { name: "Underestimate", value: under },
      { name: "Overestimate", value: over },
    ].filter((item) => item.value > 0);
  }, [records, comparison]);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  // 🔒 EXACT SAME LABEL POSITIONING AS YOUR ORIGINAL
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    outerRadius,
    percent,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 15;
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
          {/* SAME SHADOW */}
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
            outerRadius={100}
            paddingAngle={5}
            cornerRadius={10}
            dataKey="value"
            nameKey="name"
            filter="url(#pieShadow)"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth={2}
            label={renderCustomizedLabel}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[entry.name as ComparisonFlag]}
              />
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
            formatter={(value: number, name: string) => [
              `${value} records`,
              name,
            ]}
          />

          {/* SAME LEGEND POSITION */}
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
