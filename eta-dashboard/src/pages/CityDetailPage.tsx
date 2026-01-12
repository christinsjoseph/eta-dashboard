import { useMemo, useState } from "react";
import { Brush } from "recharts";
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

import PieChartBlock from "../components/PieChartBlock";
import type { EtaRecord, ComparisonFlag, TimeBucket } from "../types/eta";

const ALL_BUCKETS: TimeBucket[] = ["Morning", "Afternoon", "Evening", "Midnight"];
const ALL_FLAGS: ComparisonFlag[] = ["Similar", "Underestimate", "Overestimate"];

type Props = {
  city: string;
  records: EtaRecord[];
  onBack: () => void;
};

function getTimeBucket(runId: string): TimeBucket {
  const digits = runId.replace(/\D/g, "");
  const len = digits.length;
  let hour = 12;

  if (len >= 10) {
    const possibleHour = parseInt(digits.slice(-6, -4), 10);
    if (possibleHour >= 0 && possibleHour <= 23) hour = possibleHour;
  } else if (len >= 8) {
    const possibleHour = parseInt(digits.slice(-4, -2), 10);
    if (possibleHour >= 0 && possibleHour <= 23) hour = possibleHour;
  }

  if (hour >= 5 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 22) return "Evening";
  return "Midnight";
}
// Compact Horizontal FilterGroup component
function CompactFilterGroup({
  title,
  options,
  selected,
  onToggle,
  colored = false,
}: {
  title: string;
  options: (TimeBucket | ComparisonFlag)[];
  selected: (TimeBucket | ComparisonFlag)[];
  onToggle: (value: TimeBucket | ComparisonFlag) => void;
  colored?: boolean;
}) {
return (
<div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
<h5 style={{ fontSize: "0.8rem", fontWeight: 700, margin: 0, color: "#374151", letterSpacing: "0.02em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
{title}:
</h5>
<div style={{ display: "flex", gap: "10px", flexWrap: "nowrap" }}>
{options.map((opt) => (
<label key={opt} style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", whiteSpace: "nowrap" }}>
<input
type="checkbox"
checked={selected.includes(opt)}
onChange={() => onToggle(opt)}
style={{ accentColor: "#3b82f6", width: "14px", height: "14px", cursor: "pointer", margin: 0 }}
/>
<span
style={{
fontSize: "0.85rem",
fontWeight: 500,
color: colored
? opt === "Similar" ? "#10b981" : opt === "Underestimate" ? "#f59e0b" : "#ef4444"
: "#374151",
}}
>
{opt}
</span>
</label>
))}
</div>
</div>
);
}
export default function CityDetailPage({ city, records, onBack }: Props) {
  const [comparison, setComparison] = useState<"mappls" | "oauth2">("mappls");
  const [selectedBuckets, setSelectedBuckets] = useState<TimeBucket[]>(ALL_BUCKETS);
  const [selectedFlags, setSelectedFlags] = useState<ComparisonFlag[]>(ALL_FLAGS);
  const [isChartExpanded, setIsChartExpanded] = useState(false);
  const [isTableExpanded, setIsTableExpanded] = useState(false);
  const [uidSearch, setUidSearch] = useState("");

  


  type SortKey =
  | "uid"
  | "count"
  | "timeBucket"
  | "activeETA"
  | "googleETA"
  | "activeVariation"
  | "activeComparisonFlag";

const [sortKey, setSortKey] = useState<SortKey>("count");
const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");


  const enrichedRecords = useMemo(
  () =>
    records.map((r) => {
      const google = Number(r.googleETA ?? 0);
      const provider =
        comparison === "mappls"
          ? Number(r.mapplsETA ?? 0)
          : Number(r.oauth2ETA ?? 0);

      const variation =
        google > 0 && provider > 0
          ? ((provider - google) / google) * 100
          : 0;

      return {
        ...r,
        timeBucket: getTimeBucket(r.runId),
        activeComparisonFlag:
          comparison === "mappls"
            ? r.mapplsComparisonFlag
            : r.oauth2ComparisonFlag,
        activeETA: provider,
        activeVariation: variation
      };
    }),
  [records, comparison]
);

  const filteredRecords = useMemo(
    () =>
      enrichedRecords.filter(
        (r) =>
          selectedBuckets.includes(r.timeBucket) &&
          selectedFlags.includes(r.activeComparisonFlag)
      ),
    [enrichedRecords, selectedBuckets, selectedFlags]
  );
const expandedTableData = useMemo(() => {
  const map = new Map<
    string,
    {
      uid: string;
      timeBucket: TimeBucket;
      activeComparisonFlag: ComparisonFlag;
      count: number;
      activeETA: number;
      googleETA: number;
      activeVariation: number;
    }
  >();

  filteredRecords.forEach((r) => {
    const key = `${r.uid}__${r.timeBucket}__${r.activeComparisonFlag}`;

    if (!map.has(key)) {
      map.set(key, {
        uid: r.uid,
        timeBucket: r.timeBucket,
        activeComparisonFlag: r.activeComparisonFlag,
        count: 1,
        activeETA: r.activeETA,
        googleETA: r.googleETA,
        activeVariation: r.activeVariation,
      });
    } else {
      const row = map.get(key)!;
      row.count += 1;
      row.activeETA += r.activeETA;
      row.googleETA += r.googleETA;
      row.activeVariation += r.activeVariation;
    }
  });

  // convert sums → averages
  return Array.from(map.values()).map((r) => ({
    ...r,
    activeETA: r.activeETA / r.count,
    googleETA: r.googleETA / r.count,
    activeVariation: r.activeVariation / r.count,
  }));
}, [filteredRecords]);

const sortedExpandedTableData = useMemo(() => {
  let data = [...expandedTableData];

  // 🔍 UID search
  if (uidSearch.trim()) {
    const search = uidSearch.toLowerCase();
    data = data.filter((r) =>
      r.uid.toLowerCase() === search
    );
  }

  // ↕️ Sorting
  data.sort((a, b) => {
    const valA = a[sortKey];
    const valB = b[sortKey];

    if (typeof valA === "number" && typeof valB === "number") {
      return sortOrder === "asc" ? valA - valB : valB - valA;
    }

    return sortOrder === "asc"
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  return data;
}, [expandedTableData, sortKey, sortOrder, uidSearch]);

  const avgVariation = useMemo(() => {
    
    if (!filteredRecords.length) return "0.00";

    let sum = 0;
    let count = 0;

    filteredRecords.forEach((r) => {
      const google = Number(r.googleETA ?? 0);
      const provider =
        comparison === "mappls"
          ? Number(r.mapplsETA ?? 0)
          : Number(r.oauth2ETA ?? 0);

      if (google > 0 && provider > 0) {
        sum += (1 - provider / google) * 100;
        count++;
      }
    });

    return count ? (sum / count).toFixed(2) : "0.00";
  }, [filteredRecords, comparison]);

  const statusDistribution = useMemo(() => {
    const total = filteredRecords.length || 1;

    const similar = filteredRecords.filter(
      (r) => r.activeComparisonFlag === "Similar"
    ).length;

    const under = filteredRecords.filter(
      (r) => r.activeComparisonFlag === "Underestimate"
    ).length;

    const over = filteredRecords.filter(
      (r) => r.activeComparisonFlag === "Overestimate"
    ).length;

    return {
      similarPct: ((similar / total) * 100).toFixed(1),
      underPct: ((under / total) * 100).toFixed(1),
      overPct: ((over / total) * 100).toFixed(1),
    };
  }, [filteredRecords]);
  const handleSort = (key: SortKey) => {
  if (sortKey === key) {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  } else {
    setSortKey(key);
    setSortOrder("desc");
  }
};
const exportExpandedTableCSV = () => {
  const headers = [
    "UID",
    "Count",
    "Time Bucket",
    `${comparisonLabel} ETA`,
    "Google ETA",
    "Variation %",
    "Status",
  ];

  const rows = sortedExpandedTableData.map((r) => [
    r.uid,
    r.count,
    r.timeBucket,
    Math.round(r.activeETA),
    Math.round(r.googleETA),
    r.activeVariation.toFixed(2),
    r.activeComparisonFlag,
  ]);

  const csvContent =
    [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${city}-filtered-records.csv`;
  link.click();

  URL.revokeObjectURL(url);
};

  const avgVariationLabel =
    parseFloat(avgVariation) > 10
      ? "Underestimate"
      : parseFloat(avgVariation) < -10
      ? "Overestimate"
      : "Similar";

  const chartData = useMemo(
    () => filteredRecords.map((r, i) => ({ ...r, index: i + 1 })),
    [filteredRecords]
  );

  const timeBucketStats = useMemo(() => {
    const map: Record<TimeBucket, typeof enrichedRecords> = {
      Morning: [],
      Afternoon: [],
      Evening: [],
      Midnight: [],
    };
    filteredRecords.forEach((r) => map[r.timeBucket]?.push(r));

    return ALL_BUCKETS.map((bucket) => {
      const rows = map[bucket] || [];
      return {
        timeBucket: bucket,
        total: rows.length,
        similar: rows.filter((r) => r.activeComparisonFlag === "Similar").length,
        under: rows.filter((r) => r.activeComparisonFlag === "Underestimate").length,
        over: rows.filter((r) => r.activeComparisonFlag === "Overestimate").length,
        avgDelta: rows.length
          ? rows.reduce((s, r) => s + r.activeVariation, 0) / rows.length
          : 0,
      };
    });
  }, [filteredRecords]);

  const comparisonLabel = comparison === "mappls" ? "Mappls" : "Oauth2";

  const glass: React.CSSProperties = {
    background: "rgba(255,255,255,0.7)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: "1px solid rgba(255,255,255,0.8)",
    borderRadius: "24px",
    boxShadow: "0 12px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)",
  };

  const btnStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.95)",
    border: "1px solid rgba(255,255,255,0.9)",
    borderRadius: "14px",
    padding: "10px 20px",
    fontWeight: 600,
    cursor: "pointer",
    color: "#1f2937",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  };

  const dropdownStyle: React.CSSProperties = {
    padding: "8px 16px",
    borderRadius: "10px",
    border: "2px solid rgba(59, 130, 246, 0.3)",
    background: "white",
    fontSize: "14px",
    fontWeight: 600,
    color: "#0f172a",
    cursor: "pointer",
    outline: "none",
  };
  const thStyle: React.CSSProperties = {
  padding: "10px",
  cursor: "pointer",
  userSelect: "none",
  fontWeight: 700,
  color: "#1f2937",
  whiteSpace: "nowrap",

  /* 🔒 Sticky header */
  position: "sticky",
  top: 96,
  background: "rgba(248,250,252,0.95)",
  zIndex: 30,
  backdropFilter: "blur(6px)",
};



  return (
    <div
      style={{
        padding: "40px 24px",
        background: "linear-gradient(135deg, #a8c0ff 0%, #c9d6ff 25%, #e0c3fc 50%, #d4fc79 75%, #96e6a1 100%)",
        minHeight: "100vh",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      <div style={{ maxWidth: "1600px", margin: "0 auto", width: "100%" }}>

        {/* Normal (collapsed) layout */}
        {!isChartExpanded && (
          <>
            {/* Header */}
            <div style={{ ...glass, padding: "32px 40px", marginBottom: "32px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                <div>
                  <h1 style={{ fontSize: "2.5rem", fontWeight: 800, margin: 0, color: "#111827", letterSpacing: "-0.02em" }}>
                    {city} — ETA Analysis
                  </h1>
                  <p style={{ color: "#64748b", marginTop: "8px", fontSize: "1.05rem", fontWeight: 500 }}>
                    Showing {filteredRecords.length} of {records.length} records
                  </p>
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <select 
                    value={comparison} 
                    onChange={(e) => setComparison(e.target.value as "mappls" | "oauth2")} 
                    style={dropdownStyle}
                  >
                    <option value="mappls">Mappls vs Google</option>
                    <option value="oauth2">Oauth2 vs Google</option>
                  </select>
                  <button onClick={onBack} style={btnStyle}>← Back to Cities</button>
                </div>
              </div>
            </div>

            {/* Main Content Grid: Chart + Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "calc(70% - 120px) 480px", gap: "18px", marginBottom: "32px" }}>
              
              {/* Chart Section */}
              <div style={{ ...glass, padding: "18px", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h3 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#111827", letterSpacing: "-0.01em" }}>
                    {comparisonLabel} vs Google ETA
                  </h3>

                  <button
                    onClick={() => setIsChartExpanded(true)}
                    style={{
                      ...btnStyle,
                      padding: "18px 18px",
                      fontSize: "0.95rem",
                    }}
                  >
                    Expand ↗
                  </button>
                </div>

                {/* Compact Vertical Filters */}
                <div style={{ 
                  display: "flex", 
                  flexDirection: "column",
                  gap: "12px", 
                  marginBottom: "18px", 
                  padding: "14px 10px", 
                  background: "rgba(248,250,252,0.5)", 
                  borderRadius: "12px"
                }}>
                  <CompactFilterGroup
                    title="Time of Day"
                    options={ALL_BUCKETS}
                    selected={selectedBuckets}
                    onToggle={(b) =>
                      setSelectedBuckets((prev) =>
                        prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
                      )
                    }
                  />

                  <CompactFilterGroup
                    title="Result Type"
                    options={ALL_FLAGS}
                    selected={selectedFlags}
                    onToggle={(f) =>
                      setSelectedFlags((prev) =>
                        prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
                      )
                    }
                    colored
                  />
                </div>

                <div style={{ flex: 1, minHeight: "10px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 40, left: 10, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" opacity={0.6} />
                      <XAxis dataKey="index" tick={{ fontSize: 12, fill: "#64748b" }} />
                      <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                      <Tooltip 
                        formatter={(v: number) => `${Math.round(v)} sec`}
                        contentStyle={{ 
                          background: "rgba(255,255,255,0.95)", 
                          border: "1px solid rgba(255,255,255,0.8)",
                          borderRadius: "12px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                      <Line 
                        dataKey="activeETA" 
                        stroke="#10b981" 
                        strokeWidth={2.5} 
                        dot={false}
                        activeDot={{ r: 5 }}
                        name={comparisonLabel} 
                      />
                      <Line 
                        dataKey="googleETA" 
                        stroke="#3b82f6" 
                        strokeWidth={2.5} 
                        dot={false}
                        activeDot={{ r: 5 }}
                        name="Google" 
                      />
                      <Brush
                        dataKey="index"
                        height={30}
                        stroke="#6366f1"
                        travellerWidth={10}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Right Sidebar: Time Bucket Summary + Pie Chart */}
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Time Bucket Summary */}
                <div style={{ ...glass, padding: "20px 16px" }}>
                  <h3 style={{ textAlign: "center", margin: "0 0 14px 0", fontSize: "1.1rem", fontWeight: 700, color: "#111827", letterSpacing: "-0.01em" }}>
                    Time Bucket Summary
                  </h3>

                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 5px", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ background: "rgba(241,245,249,0.8)", borderRadius: "8px" }}>
                          <th style={{ padding: "7px 4px", borderRadius: "8px 0 0 8px", fontWeight: 700, color: "#374151", fontSize: "12px" }}>Period</th>
                          <th style={{ padding: "7px 4px", fontWeight: 700, color: "#374151", fontSize: "12px" }}>Total</th>
                          <th style={{ padding: "7px 4px", color: "#10b981", fontWeight: 700, fontSize: "12px" }}>Similar</th>
                          <th style={{ padding: "7px 4px", color: "#f59e0b", fontWeight: 700, fontSize: "12px" }}>Under</th>
                          <th style={{ padding: "7px 4px", color: "#ef4444", borderRadius: "0 8px 8px 0", fontWeight: 700, fontSize: "12px" }}>Over</th>
                        </tr>
                      </thead>
                      <tbody>
                        {timeBucketStats.map((s, i) => (
                          <tr key={s.timeBucket} style={{ 
                            background: i % 2 ? "rgba(248,250,252,0.5)" : "rgba(255,255,255,0.3)",
                            borderRadius: "6px"
                          }}>
                            <td style={{ padding: "8px 4px", fontWeight: 700, color: "#1f2937", fontSize: "12.5px" }}>{s.timeBucket}</td>
                            <td style={{ padding: "8px 4px", textAlign: "center", fontWeight: 600 }}>{s.total}</td>
                            <td style={{ padding: "8px 4px", textAlign: "center", fontWeight: s.similar ? 700 : 400 }}>{s.similar}</td>
                            <td style={{ padding: "8px 4px", textAlign: "center", fontWeight: s.under ? 700 : 400 }}>{s.under}</td>
                            <td style={{ padding: "8px 4px", textAlign: "center", fontWeight: s.over ? 700 : 400 }}>{s.over}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Average Variation */}
                <div
                  style={{
                    ...glass,
                    padding: "20px 20px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      color: "#64748b",
                      marginBottom: "8px",
                      textTransform: "uppercase",
                    }}
                  >
                    Average Variation ({comparisonLabel} vs Google)
                  </div>

                  <div
                    style={{
                      fontSize: "38px",
                      fontWeight: 900,
                      lineHeight: 1,
                      color:
                        parseFloat(avgVariation) > 10
                          ? "#ef4444"
                          : parseFloat(avgVariation) < -10
                          ? "#f59e0b"
                          : "#10b981",
                    }}
                  >
                    {avgVariation}%
                  </div>

                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      marginTop: "6px",
                      color: "#374151",
                    }}
                  >
                    {avgVariationLabel}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: "20px",
                      marginTop: "12px",
                      fontSize: "13px",
                      fontWeight: 700,
                    }}
                  >
                    <span style={{ color: "#10b981" }}>
                      Similar {statusDistribution.similarPct}%
                    </span>
                    <span style={{ color: "#f59e0b" }}>
                      Under {statusDistribution.underPct}%
                    </span>
                    <span style={{ color: "#ef4444" }}>
                      Over {statusDistribution.overPct}%
                    </span>
                  </div>
                </div>

                {/* Pie Chart */}
                <div style={{ ...glass, padding: "20px 20px 12px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", minHeight: "320px" }}>
                  <h4 style={{ textAlign: "center", margin: "0 0 20px 0", fontSize: "0.95rem", fontWeight: 700, color: "#374151", letterSpacing: "0.02em" }}>
                    OVERALL SPLIT ({comparisonLabel} vs Google)
                  </h4>
                  <div style={{ width: "100%", height: "280px", display: "flex", justifyContent: "center", alignItems: "flex-start", marginTop: "10px" }}>
                    <PieChartBlock records={filteredRecords} comparison={comparison} />
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Records */}
            <div style={{ ...glass, padding: "32px", marginTop: "60px" }}>
              <h3 style={{ textAlign: "center", marginBottom: "24px", fontSize: "1.5rem", fontWeight: 700, color: "#111827", letterSpacing: "-0.01em" }}>
                Recent Records (Top 20)
              </h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", minWidth: "900px", borderCollapse: "separate", borderSpacing: "0 10px" }}>
                  <thead>
                    <tr style={{ background: "rgba(241,245,249,0.8)" }}>
                      <th style={{ padding: "14px 16px", fontWeight: 700, color: "#374151", borderRadius: "12px 0 0 12px" }}>UID</th>
                      <th style={{ padding: "14px 16px", fontWeight: 700, color: "#374151" }}>Time</th>
                      <th style={{ padding: "14px 16px", fontWeight: 700, color: "#374151" }}>{comparisonLabel}</th>
                      <th style={{ padding: "14px 16px", fontWeight: 700, color: "#374151" }}>Google</th>
                      <th>Variation %</th>
    <th style={{ padding: "14px 16px", fontWeight: 700, color: "#374151", borderRadius: "0 12px 12px 0" }}>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.slice(0, 20).map((r, idx) => (
                      <tr key={`${r.runId}-${r.uid}`} style={{ 
                        background: idx % 2 ? "rgba(248,250,252,0.5)" : "rgba(255,255,255,0.3)",
                        transition: "all 0.2s ease"
                      }}>
                        <td style={{ padding: "16px", textAlign: "center", fontWeight: 600, color: "#1f2937" }}>{r.uid}</td>
                        <td style={{ padding: "16px", textAlign: "center", fontWeight: 500 }}>{r.timeBucket}</td>
                        <td style={{ padding: "16px", textAlign: "center", color: "#10b981", fontWeight: 700, fontSize: "1.05rem" }}>{Math.round(r.activeETA)}</td>
                        <td style={{ padding: "16px", textAlign: "center", color: "#3b82f6", fontWeight: 700, fontSize: "1.05rem" }}>{Math.round(r.googleETA)}</td>
                        <td
  style={{
    padding: "16px",
    textAlign: "center",
    fontWeight: 700,
    color:
      r.activeVariation > 10
        ? "#ef4444"
        : r.activeVariation < -10
        ? "#f59e0b"
        : "#10b981",
  }}
>
  {r.activeVariation.toFixed(2)}%
</td>

                        <td
                          style={{
                            padding: "16px",
                            textAlign: "center",
                            fontWeight: 700,
                            color: r.activeComparisonFlag === "Similar" ? "#10b981" : r.activeComparisonFlag === "Underestimate" ? "#f59e0b" : "#ef4444",
                          }}
                        >
                          {r.activeComparisonFlag}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Expanded full-screen view */}
        {isChartExpanded && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "linear-gradient(135deg, #e0f2fe 0%, #dbeafe 25%, #e0e7ff 50%, #fce7f3 75%, #fce4ec 100%)",
              zIndex: 1000,
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <h2 style={{ margin: "0 0 8px 0", fontSize: "2rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em" }}>
                  {comparisonLabel} vs Google ETA — Full View ({city})
                </h2>
                <select
  value={comparison}
  onChange={(e) => setComparison(e.target.value as "mappls" | "oauth2")}
  style={{
    marginTop: "8px",
    padding: "8px 16px",
    borderRadius: "10px",
    border: "2px solid rgba(59,130,246,0.3)",
    background: "white",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  }}
>
  <option value="mappls">Mappls vs Google</option>
  <option value="oauth2">Oauth2 vs Google</option>
</select>

                <p style={{ margin: 0, fontSize: "0.95rem", color: "#64748b" }}>
                  Showing {filteredRecords.length} filtered records
                </p>
              </div>

              {/* Average Variation Card (Expanded View) */}
              <div style={{ 
                ...glass, 
                padding: "16px 24px", 
                minWidth: "280px",
                textAlign: "center"
              }}>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    color: "#64748b",
                    textTransform: "uppercase",
                    marginBottom: "6px",
                  }}
                >
                  <div
  style={{
    fontSize: "12px",
    fontWeight: 600,
    color: "#475569",
    marginBottom: "8px",
  }}
>
  Total Records: <b>{records.length}</b>
  <span style={{ margin: "0 6px" }}>•</span>
  After Filters: <b>{filteredRecords.length}</b>
</div>
                  Avg Variation
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "6px",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "36px",
                      fontWeight: 900,
                      lineHeight: 1,
                      color:
                        parseFloat(avgVariation) > 10
                          ? "#ef4444"
                          : parseFloat(avgVariation) < -10
                          ? "#f59e0b"
                          : "#10b981",
                    }}
                  >
                    {avgVariation}
                  </span>
                  <span
                    style={{
                      fontSize: "18px",
                      fontWeight: 800,
                      color: "#475569",
                    }}
                  >
                    %
                  </span>
                </div>

                <div
                  style={{
                    marginTop: "4px",
                    fontSize: "13px",
                    fontWeight: 700,
                    color:
                      parseFloat(avgVariation) > 10
                        ? "#ef4444"
                        : parseFloat(avgVariation) < -10
                        ? "#f59e0b"
                        : "#10b981",
                  }}
                >
                  {parseFloat(avgVariation) > 10
                    ? "Mostly Underestimated"
                    : parseFloat(avgVariation) < -10
                    ? "Mostly Overestimated"
                    : "Mostly Similar"}
                </div>

                <div
                  style={{
                    height: "1px",
                    background: "linear-gradient(to right, transparent, #e5e7eb, transparent)",
                    margin: "12px 0",
                  }}
                />

                <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    textAlign: "center",
    fontSize: "12px",
    fontWeight: 700,
  }}
>
  <div>
    <div style={{ color: "#10b981", fontSize: "14px", fontWeight: 800 }}>
      {statusDistribution.similarPct}%
    </div>
    <div style={{ color: "#64748b" }}>Similar</div>
    <div style={{ fontSize: "11px", color: "#374151", marginTop: "2px" }}>
      {
        filteredRecords.filter(
          (r) => r.activeComparisonFlag === "Similar"
        ).length
      } records
    </div>
  </div>

  <div>
    <div style={{ color: "#f59e0b", fontSize: "14px", fontWeight: 800 }}>
      {statusDistribution.underPct}%
    </div>
    <div style={{ color: "#64748b" }}>Under</div>
    <div style={{ fontSize: "11px", color: "#374151", marginTop: "2px" }}>
      {
        filteredRecords.filter(
          (r) => r.activeComparisonFlag === "Underestimate"
        ).length
      } records
    </div>
  </div>

  <div>
    <div style={{ color: "#ef4444", fontSize: "14px", fontWeight: 800 }}>
      {statusDistribution.overPct}%
    </div>
    <div style={{ color: "#64748b" }}>Over</div>
    <div style={{ fontSize: "11px", color: "#374151", marginTop: "2px" }}>
      {
        filteredRecords.filter(
          (r) => r.activeComparisonFlag === "Overestimate"
        ).length
      } records
    </div>
  </div>
</div>
            </div>
              <button
                onClick={() => setIsChartExpanded(false)}
                style={{
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: "48px",
                  height: "48px",
                  fontSize: "2rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                  transition: "all 0.2s ease",
                }}
              >
                ×
              </button>
            </div>

            {/* Compact Horizontal Filters */}
            <div style={{ 
              ...glass,
              display: "flex", 
              gap: "40px", 
              marginBottom: "16px", 
              padding: "12px 28px",
              justifyContent: "center",
              alignItems: "center",
            }}>
              <CompactFilterGroup
                title="Time of Day"
                options={ALL_BUCKETS}
                selected={selectedBuckets}
                onToggle={(b) =>
                  setSelectedBuckets((prev) =>
                    prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
                  )
                }
              />

              <CompactFilterGroup
                title="Result Type"
                options={ALL_FLAGS}
                selected={selectedFlags}
                onToggle={(f) =>
                  setSelectedFlags((prev) =>
                    prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
                  )
                }
                colored
              />
            </div>

            {/* Chart + Table Container */}
<div
  style={{
    flex: "1 1 auto",
    display: "flex",
    flexDirection: "column",
    minHeight: "800px", // 🔴 VERY IMPORTANT
  }}
>
            {/* Chart */}
<div
  style={{
    flex: "0 0 55%",   // chart takes ~55%
    minHeight: "420px",
    marginBottom: "20px",
  }}
>
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={chartData} margin={{ top: 20, right: 60, left: 40, bottom: 50 }}>
      <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" opacity={0.6} />
      <XAxis
        dataKey="index"
        tick={{ fontSize: 14, fill: "#64748b" }}
      />
      <YAxis
        tick={{ fontSize: 14, fill: "#64748b" }}
        label={{ value: "ETA (sec)", angle: -90, position: "insideLeft", offset: 0, style: { fontSize: 15, fill: "#374151", fontWeight: 600 } }}
      />
      <Tooltip
        formatter={(v: number) => `${Math.round(v)} sec`}
        contentStyle={{ 
          fontSize: 15,
          background: "rgba(255,255,255,0.95)",
          border: "1px solid rgba(255,255,255,0.8)",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
        }}
      />
<Legend
wrapperStyle={{ fontSize: 15, fontWeight: 600 }}
verticalAlign="bottom"
align="center"
iconType="line"
/>
<Line
dataKey="activeETA"
stroke="#10b981"
strokeWidth={4}
dot={false}
activeDot={{ r: 7 }}
name={`${comparisonLabel} ETA`}
/>
<Line
dataKey="googleETA"
stroke="#3b82f6"
strokeWidth={4}
dot={false}
activeDot={{ r: 7 }}
name="Google ETA"
/>
<Brush
                 dataKey="index"
                 height={40}
                 stroke="#4f46e5"
                 travellerWidth={14}
               />
</LineChart>
</ResponsiveContainer>
</div>
{/* Filtered Records Table */}
<div
  style={{
    ...glass,
    padding: "24px",
    paddingTop: 0,
    minHeight: 0,
    flex: "1 1 auto",
    overflowY: "auto",
    position: isTableExpanded ? "fixed" : "relative",
    inset: isTableExpanded ? 0 : undefined,
    zIndex: isTableExpanded ? 3000 : undefined,
    borderRadius: isTableExpanded ? 0 : undefined,
    background: isTableExpanded
      ? "linear-gradient(135deg, #eef2ff, #ffffff)"
      : undefined,
  }}
>

         <div
  style={{
    position: "sticky",
    top: 0,
    zIndex: 20,
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(10px)",
    padding: "16px 0 12px 0",
    borderBottom: "1px solid #e5e7eb",
  }}
>
  <button
  onClick={() => setIsTableExpanded(!isTableExpanded)}
  style={{
    position: "absolute",
    right: 16,
    top: 12,
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: 700,
    borderRadius: "10px",
    border: "1px solid #c7d2fe",
    background: "white",
    cursor: "pointer",
  }}
>
  {isTableExpanded ? "Close Table" : "Expand Table"}
</button>
<div style={{ position: "absolute", right: 16, top: 12, display: "flex", gap: "8px" }}>
  <button
    onClick={exportExpandedTableCSV}
    style={{
      padding: "6px 12px",
      fontSize: "12px",
      fontWeight: 700,
      borderRadius: "10px",
      border: "1px solid #c7d2fe",
      background: "white",
      cursor: "pointer",
    }}
  >
    Export CSV
  </button>

  <button
    onClick={() => setIsTableExpanded(!isTableExpanded)}
    style={{
      padding: "6px 12px",
      fontSize: "12px",
      fontWeight: 700,
      borderRadius: "10px",
      border: "1px solid #c7d2fe",
      background: "white",
      cursor: "pointer",
    }}
  >
    {isTableExpanded ? "Close Table" : "Expand Table"}
  </button>
</div>
<div
  style={{
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    marginBottom: "8px",
  }}
>
  <input
    type="text"
    placeholder="Search UID..."
    value={uidSearch}
    onChange={(e) => setUidSearch(e.target.value)}
    style={{
      padding: "6px 10px",
      borderRadius: "8px",
      border: "1px solid #cbd5f5",
      fontSize: "13px",
      width: "220px",
      outline: "none",
    }}
  />
</div>

  <h3
    style={{
      textAlign: "center",
      margin: 0,
      fontSize: "1.25rem",
      fontWeight: 700,
      color: "#111827",
    }}
  >
    Filtered Records —
    <span style={{ color: "#334155", marginLeft: "6px" }}>
      Total: {filteredRecords.length}
    </span>
    <span style={{ margin: "0 6px" }}>•</span>
    <span style={{ color: "#0f172a" }}>
      Unique UIDs: {sortedExpandedTableData.length}
    </span>
  </h3>
  <div style={{ textAlign: "center", marginTop: "6px" }}>
  <button
    onClick={() => setIsTableExpanded(true)}
    style={{
      background: "white",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      padding: "6px 12px",
      fontSize: "12px",
      fontWeight: 600,
      cursor: "pointer",
    }}
  >
  </button>
</div>

</div>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
              marginTop: 56,
            }}
          >
            <thead>
  <tr
  style={{
    borderBottom: "2px solid #e5e7eb",
    background: "rgba(248,250,252,0.95)",
  }}
>

    <th style={thStyle} onClick={() => handleSort("uid")}>
      UID {sortKey === "uid" && (sortOrder === "asc" ? "▲" : "▼")}
    </th>
    <th style={thStyle} onClick={() => handleSort("count")}>
      Count {sortKey === "count" && (sortOrder === "asc" ? "▲" : "▼")}
    </th>
    <th style={thStyle} onClick={() => handleSort("timeBucket")}>
      Bucket {sortKey === "timeBucket" && (sortOrder === "asc" ? "▲" : "▼")}
    </th>
    <th style={thStyle} onClick={() => handleSort("activeETA")}>
      {comparisonLabel} {sortKey === "activeETA" && (sortOrder === "asc" ? "▲" : "▼")}
    </th>
    <th style={thStyle} onClick={() => handleSort("googleETA")}>
      Google {sortKey === "googleETA" && (sortOrder === "asc" ? "▲" : "▼")}
    </th>
    <th style={thStyle} onClick={() => handleSort("activeVariation")}>
      Variation% {sortKey === "activeVariation" && (sortOrder === "asc" ? "▲" : "▼")}
    </th>
    <th style={thStyle} onClick={() => handleSort("activeComparisonFlag")}>
      Status {sortKey === "activeComparisonFlag" && (sortOrder === "asc" ? "▲" : "▼")}
    </th>
  </tr>
</thead>

            <tbody>
              {sortedExpandedTableData.map((r) => (
                <tr
  key={`${r.uid}-${r.timeBucket}-${r.activeComparisonFlag}`}
  style={{ borderBottom: "1px solid #e5e7eb" }}
>

                  <td style={{ padding: "8px", textAlign: "center", fontWeight: 700 }}>
  {r.uid}
</td>

<td style={{ padding: "8px", textAlign: "center", fontWeight: 700 }}>
  {r.count}
</td>

<td style={{ padding: "8px", textAlign: "center" }}>
  {r.timeBucket}
</td>

                  <td style={{ padding: "8px", textAlign: "center" }}>
                    {Math.round(r.activeETA)}
                  </td>
                  <td style={{ padding: "8px", textAlign: "center" }}>
                    {Math.round(r.googleETA)}
                  </td>
                  <td style={{ padding: "8px", textAlign: "center" }}>
                    {Math.round(r.activeVariation)}
                  </td>
                  <td
                    style={{
                      padding: "8px",
                      textAlign: "center",
                      fontWeight: 700,
                      color:
                        r.activeComparisonFlag === "Similar"
                          ? "#10b981"
                          : r.activeComparisonFlag === "Underestimate"
                          ? "#f59e0b"
                          : "#ef4444",
                    }}
                  >
                    {r.activeComparisonFlag}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    )}
  </div>
  </div>
  );
}
