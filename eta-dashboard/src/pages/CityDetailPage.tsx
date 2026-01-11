import { useMemo, useState } from "react";
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

export default function CityDetailPage({ city, records, onBack }: Props) {
  const [comparison, setComparison] = useState<"mappls" | "oauth2">("mappls");
  const [selectedBuckets, setSelectedBuckets] = useState<TimeBucket[]>(ALL_BUCKETS);
  const [selectedFlags, setSelectedFlags] = useState<ComparisonFlag[]>(ALL_FLAGS);
  const [isChartExpanded, setIsChartExpanded] = useState(false);

  const enrichedRecords = useMemo(
    () => records.map((r) => ({ 
      ...r, 
      timeBucket: getTimeBucket(r.runId),
      // Use the correct comparison flag based on selection
      activeComparisonFlag: comparison === "mappls" ? r.mapplsComparisonFlag : r.oauth2ComparisonFlag,
      activeETA: comparison === "mappls" ? r.mapplsETA : r.oauth2ETA,
      activeDifference: comparison === "mappls" ? r.mapplsDifference : r.oauth2Difference,
    })),
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
          ? rows.reduce((s, r) => s + r.activeDifference, 0) / rows.length
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
                        dot={{ fill: "#10b981", r: 3 }}
                        activeDot={{ r: 5 }}
                        name={comparisonLabel} 
                      />
                      <Line 
                        dataKey="googleETA" 
                        stroke="#3b82f6" 
                        strokeWidth={2.5} 
                        dot={{ fill: "#3b82f6", r: 3 }}
                        activeDot={{ r: 5 }}
                        name="Google" 
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

                {/* Pie Chart */}
                <div style={{ ...glass, padding: "20px 20px 12px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", minHeight: "320px", marginTop: "24px" }}>
                  <h4 style={{ textAlign: "center", margin: "0 0 20px 0", fontSize: "0.95rem", fontWeight: 700, color: "#374151", letterSpacing: "0.02em" }}>
                    OVERALL SPLIT ({comparisonLabel} vs Google)
                  </h4>
                  <div style={{ width: "100%", height: "280px", display: "flex", justifyContent: "center", alignItems: "flex-start", marginTop: "10px" }}>
                    <PieChartBlock records={enrichedRecords} comparison={comparison} />
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
                      <th style={{ padding: "14px 16px", fontWeight: 700, color: "#374151" }}>Δ</th>
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
                        <td style={{ padding: "16px", textAlign: "center", fontWeight: 600 }}>{Math.round(r.activeDifference)}</td>
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
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ margin: 0, fontSize: "2rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em" }}>
                {comparisonLabel} vs Google ETA — Full View
              </h2>
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
              alignItems: "center"
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

            {/* Much bigger chart in expanded view - 80% of screen */}
            <div style={{ flex: 1, minHeight: 10, paddingBottom: "20px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 60, left: 40, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" opacity={0.6} />
                  <XAxis
                    dataKey="index"
                    tick={{ fontSize: 14, fill: "#64748b" }}
                    //label={{ value: "Record #", position: "insideBottom", offset: -8, style: { fontSize: 15, fill: "#374151", fontWeight: 600 } }}
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
                    dot={{ fill: "#10b981", r: 4 }}
                    activeDot={{ r: 7 }}
                    name={`${comparisonLabel} ETA`}
                  />
                  <Line 
                    dataKey="googleETA" 
                    stroke="#3b82f6" 
                    strokeWidth={4} 
                    dot={{ fill: "#3b82f6", r: 4 }}
                    activeDot={{ r: 7 }}
                    name="Google ETA" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
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
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
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