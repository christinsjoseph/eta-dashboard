import { useState, useMemo, useEffect } from "react";
import OverviewPage from "./pages/OverviewPage";
import CityDetailPage from "./pages/CityDetailPage";
import { parseEtaCsv } from "./data/csvParser";
import { aggregateByCity } from "./data/aggregations";
import type { EtaRecord } from "./types/eta";
import ComparisonPage from "./pages/ComparisonPage";


type Source = {
  id: string;
  name: string;
  records: EtaRecord[];
  cityStats?: any[]; // For aggregated data
  totalRecords?: number; // For aggregated mode
};

function runIdFromDate(date: string, end = false) {
  return date.replaceAll("-", "") + (end ? "_235959" : "_000000");
}

export default function App() {
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  // 🔁 Comparison mode state
const [comparisonIds, setComparisonIds] = useState<string[]>([]);
const [comparisonMode, setComparisonMode] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [mongoLoading, setMongoLoading] = useState(false);
  const [collections, setCollections] = useState<string[]>([]);
const [selectedCollection, setSelectedCollection] = useState("");
const [collectionRange, setCollectionRange] = useState<{
  minDate: string;
  maxDate: string;
} | null>(null);



  const mergedRecords = useMemo(
    () => sources.filter((s) => appliedIds.includes(s.id)).flatMap((s) => s.records),
    [sources, appliedIds]
  );

  const cityStats = useMemo(() => {
    // If we have aggregated city stats from MongoDB, use those
    const mongoSource = sources.find(s => appliedIds.includes(s.id) && s.cityStats);
    if (mongoSource?.cityStats) {
      return mongoSource.cityStats;
    }
    // Otherwise aggregate from CSV records
    return aggregateByCity(mergedRecords);
  }, [sources, appliedIds, mergedRecords]);
useEffect(() => {
  fetch(`${import.meta.env.VITE_API_BASE}/api/eta/collections`)
    .then(res => res.json())
    .then(data => {
      setCollections(data.collections || []);
    })
    .catch(err => {
      console.error("Failed to load collections", err);
      setCollections([]);
    });
}, []);
// 🔽 AUTO-FETCH DATE RANGE WHEN COLLECTION CHANGES
useEffect(() => {
  if (!selectedCollection) {
    setCollectionRange(null);
    setFromDate("");
    setToDate("");
    return;
  }

  fetch(
    `${import.meta.env.VITE_API_BASE}/api/eta/collection-range?collectionName=${selectedCollection}`
  )
    .then((res) => res.json())
    .then(({ minDate, maxDate }) => {
      if (minDate && maxDate) {
        setCollectionRange({ minDate, maxDate });
      }
    })
    .catch((err) => {
      console.error("Failed to fetch collection date range", err);
      setCollectionRange(null);
    });
}, [selectedCollection]);


  function uploadCsv(file: File) {
    parseEtaCsv(file, (parsed) => {
      setSources((prev) => [
        ...prev,
        {
          id: `csv-${Date.now()}`,
          name: file.name,
          records: parsed,
        },
      ]);
    });
  }

  async function importMongo() {
   if (!fromDate || !toDate || !selectedCollection) return;
    setMongoLoading(true);
    try {
      // First, fetch aggregated data (fast)
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/eta`, {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
  fromRunId: runIdFromDate(fromDate),
  toRunId: runIdFromDate(toDate, true),
  collectionName: selectedCollection,
  mode: "full",
  limit: 500000,
}),
      });
      const response = await res.json();
      
      setSources((prev) => {
  const newSource = {
    id: `mongo-${Date.now()}`,
    name: `${selectedCollection} (${fromDate} → ${toDate})`,
    records: response.data || [],
    totalRecords: response.data?.length || 0,
  };
  return [...prev, newSource];
});

    } catch (e) {
      console.error("Failed to fetch Mongo data:", e);
      alert("Failed to fetch Mongo data");
    } finally {
      setMongoLoading(false);
    }
  }

  function applyAnalysis() {
  setAppliedIds([...selectedIds]);
  setSelectedIds([]); 
  setSelectedCity(null);
}

  function removeSource(id: string) {
    setSources((prev) => prev.filter((s) => s.id !== id));
    setSelectedIds((prev) => prev.filter((x) => x !== id));
    setAppliedIds((prev) => prev.filter((x) => x !== id));
  }

  function resetToHome() {
    setAppliedIds([]);
    setSelectedIds([]);
    setSelectedCity(null);
  }

  // Get total record count
  const totalRecords = useMemo(() => {
    return sources
      .filter(s => appliedIds.includes(s.id))
      .reduce((sum, s) => sum + (s.totalRecords || s.records.length), 0);
  }, [sources, appliedIds]);

  if (selectedCity) {
    return (
      <CityDetailPage
        city={selectedCity}
        records={mergedRecords.filter((r) => r.city === selectedCity)}
        onBack={() => setSelectedCity(null)}
      />
    );
  }

  if (appliedIds.length > 0) {
    return (
      <OverviewPage
        cityStats={cityStats}
        records={mergedRecords}
        csvNames={sources.filter((s) => appliedIds.includes(s.id)).map((s) => s.name)}
        reportLabel="ETA Analysis Report"
        onCityClick={setSelectedCity}
        onBackToHome={resetToHome}
        totalRecords={totalRecords}
      />
    );
  }
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
        padding: "40px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated background elements */}
      <div style={{
        position: "absolute",
        top: "10%",
        left: "5%",
        width: "400px",
        height: "400px",
        background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
        borderRadius: "50%",
        filter: "blur(60px)",
        animation: "float 8s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute",
        bottom: "10%",
        right: "5%",
        width: "500px",
        height: "500px",
        background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)",
        borderRadius: "50%",
        filter: "blur(80px)",
        animation: "float 10s ease-in-out infinite reverse",
      }} />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .source-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15) !important;
        }
        .import-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.2) !important;
        }
        .primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 48px rgba(255, 255, 255, 0.4) !important;
        }
        .delete-btn:hover {
          transform: scale(1.1) rotate(90deg);
        }
      `}</style>

      <div style={{ maxWidth: "1400px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Premium Header */}
        <div style={{ textAlign: "center", marginBottom: "72px", animation: "slideUp 0.8s ease-out" }}>
          <div style={{
            display: "inline-block",
            padding: "8px 24px",
            background: "rgba(255, 255, 255, 0.2)",
            backdropFilter: "blur(10px)",
            borderRadius: "50px",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            marginBottom: "24px",
            fontSize: "14px",
            fontWeight: "600",
            color: "white",
            letterSpacing: "0.05em",
          }}>
            ✨ ANALYTICS PLATFORM
          </div>
          <h1
            style={{
              fontSize: "72px",
              fontWeight: "900",
              color: "white",
              marginBottom: "16px",
              letterSpacing: "-0.04em",
              textShadow: "0 4px 30px rgba(0, 0, 0, 0.2)",
              lineHeight: "1.1",
            }}
          >
            ETA Dashboard
          </h1>
          <p
            style={{
              fontSize: "20px",
              color: "rgba(255, 255, 255, 0.95)",
              fontWeight: "500",
              textShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
            }}
          >
            Advanced performance tracking and insights
          </p>
        </div>

        {/* Main Content Card */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)",
            backdropFilter: "blur(40px) saturate(180%)",
            borderRadius: "40px",
            border: "1px solid rgba(255, 255, 255, 0.6)",
            boxShadow: "0 40px 100px rgba(0, 0, 0, 0.2), 0 0 1px rgba(255, 255, 255, 0.8) inset",
            overflow: "hidden",
            animation: "slideUp 1s ease-out",
          }}
        >
          {/* Import Section */}
          <div style={{ padding: "64px 56px" }}>
            <div style={{ textAlign: "center", marginBottom: "56px" }}>
              <h2
                style={{
                  fontSize: "42px",
                  fontWeight: "800",
                  background: "linear-gradient(135deg, #1e293b 0%, #475569 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  marginBottom: "12px",
                  letterSpacing: "-0.02em",
                }}
              >
                Import Data Sources
              </h2>
              <p style={{ fontSize: "17px", color: "#64748b", fontWeight: "500" }}>
                Connect your data to unlock powerful insights
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
                gap: "32px",
                marginBottom: sources.length > 0 ? "72px" : "0",
              }}
            >
              {/* CSV Upload Card */}
              <div
                className="import-card"
                style={{
                  background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(37, 99, 235, 0.04) 100%)",
                  borderRadius: "32px",
                  padding: "48px 40px",
                  border: "2px solid rgba(59, 130, 246, 0.15)",
                  textAlign: "center",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 12px 40px rgba(59, 130, 246, 0.1)",
                }}
              >
                <div
                  style={{
                    width: "88px",
                    height: "88px",
                    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                    borderRadius: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 28px",
                    boxShadow: "0 16px 48px rgba(59, 130, 246, 0.35)",
                  }}
                >
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="12" y1="18" x2="12" y2="12"></line>
                    <line x1="9" y1="15" x2="15" y2="15"></line>
                  </svg>
                </div>
                <h3
                  style={{
                    fontSize: "26px",
                    fontWeight: "700",
                    color: "#0f172a",
                    marginBottom: "12px",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Upload CSV Files
                </h3>
                <p
                  style={{
                    fontSize: "15px",
                    color: "#64748b",
                    marginBottom: "32px",
                    lineHeight: "1.7",
                    fontWeight: "500",
                  }}
                >
                  Import multiple CSV files with ETA records for comprehensive analysis
                </p>
                <label
                  style={{
                    display: "inline-block",
                    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                    color: "white",
                    fontWeight: "700",
                    padding: "16px 40px",
                    borderRadius: "16px",
                    cursor: "pointer",
                    fontSize: "15px",
                    letterSpacing: "0.02em",
                    boxShadow: "0 12px 32px rgba(59, 130, 246, 0.35)",
                    transition: "all 0.3s ease",
                    border: "none",
                  }}
                  className="primary-btn"
                >
                  Choose Files
                  <input
                    type="file"
                    accept=".csv"
                    multiple
                    hidden
                    onChange={(e) => {
                      if (e.target.files) {
                        Array.from(e.target.files).forEach(uploadCsv);
                      }
                    }}
                  />
                </label>
              </div>

              {/* MongoDB Import Card */}
              <div
                className="import-card"
                style={{
                  background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.04) 100%)",
                  borderRadius: "32px",
                  padding: "48px 40px",
                  border: "2px solid rgba(16, 185, 129, 0.15)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 12px 40px rgba(16, 185, 129, 0.1)",
                }}
              >
                <div
                  style={{
                    width: "88px",
                    height: "88px",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    borderRadius: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 28px",
                    boxShadow: "0 16px 48px rgba(16, 185, 129, 0.35)",
                  }}
                >
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                  </svg>
                </div>
                <h3
                  style={{
                    fontSize: "26px",
                    fontWeight: "700",
                    color: "#0f172a",
                    marginBottom: "12px",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Import from MongoDB
                </h3>
                <p
                  style={{
                    fontSize: "15px",
                    color: "#64748b",
                    marginBottom: "32px",
                    lineHeight: "1.7",
                    fontWeight: "500",
                  }}
                >
                  Connect to your database and fetch records by date range
                </p>
                {collections.length > 0 && (
  <div>
    <label
      style={{
        display: "block",
        fontSize: "13px",
        fontWeight: "700",
        color: "#475569",
        marginBottom: "10px",
        textAlign: "left",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      Select Collection
    </label>

    <select
      value={selectedCollection}
      onChange={(e) => setSelectedCollection(e.target.value)}
      style={{
        padding: "16px 20px",
        borderRadius: "14px",
        border: "2px solid rgba(203, 213, 225, 0.4)",
        background: "rgba(255, 255, 255, 0.9)",
        width: "100%",
        fontSize: "15px",
        fontWeight: "600",
        color: "#0f172a",
        outline: "none",
      }}
    >
      <option value="">-- Select collection --</option>
      {collections.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
    {collectionRange && (
  <div
    style={{
      marginTop: "8px",
      fontSize: "13px",
      color: "#64748b",
      fontWeight: "600",
      textAlign: "left",
    }}
  >
    Available data range:&nbsp;
    <strong style={{ color: "#0f172a" }}>
      {collectionRange.minDate}
    </strong>{" "}
    →{" "}
    <strong style={{ color: "#0f172a" }}>
      {collectionRange.maxDate}
    </strong>
  </div>
)}

  </div>
)}

                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: "700",
                        color: "#475569",
                        marginBottom: "10px",
                        textAlign: "left",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      From Date
                    </label>
                    <input
  type="date"
  value={fromDate}
  min={collectionRange?.minDate}
  max={collectionRange?.maxDate}
  onChange={(e) => setFromDate(e.target.value)}
  style={{
    padding: "16px 20px",
    borderRadius: "14px",
    border: "2px solid rgba(203, 213, 225, 0.4)",
    background: "rgba(255, 255, 255, 0.9)",
    width: "100%",
    fontSize: "15px",
    fontWeight: "600",
    color: "#0f172a",
    outline: "none",
    transition: "all 0.2s ease",
  }}
/>

                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: "700",
                        color: "#475569",
                        marginBottom: "10px",
                        textAlign: "left",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      To Date
                    </label>
                    <input
  type="date"
  value={toDate}
  min={collectionRange?.minDate}
  max={collectionRange?.maxDate}
  onChange={(e) => setToDate(e.target.value)}
  style={{
    padding: "16px 20px",
    borderRadius: "14px",
    border: "2px solid rgba(203, 213, 225, 0.4)",
    background: "rgba(255, 255, 255, 0.9)",
    width: "100%",
    fontSize: "15px",
    fontWeight: "600",
    color: "#0f172a",
    outline: "none",
    transition: "all 0.2s ease",
  }}
/>

                  </div>
                  <button
                    style={{
                      background: mongoLoading || !fromDate || !toDate
                        ? "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)"
                        : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      color: "white",
                      fontWeight: "700",
                      padding: "16px 40px",
                      borderRadius: "16px",
                      border: "none",
                      cursor: !fromDate || !toDate || mongoLoading ? "not-allowed" : "pointer",
                      fontSize: "15px",
                      letterSpacing: "0.02em",
                      boxShadow: !fromDate || !toDate || mongoLoading
                        ? "0 8px 24px rgba(148, 163, 184, 0.3)"
                        : "0 12px 32px rgba(16, 185, 129, 0.35)",
                      transition: "all 0.3s ease",
                      marginTop: "8px",
                    }}
                    className={!fromDate || !toDate || mongoLoading ? "" : "primary-btn"}
                    disabled={!fromDate || !toDate || !selectedCollection || mongoLoading}
                    onClick={importMongo}
                  >
                    {mongoLoading ? (
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                        <span style={{ display: "inline-block", width: "16px", height: "16px", border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}></span>
                        Importing...
                      </span>
                    ) : "Import Data"}
                  </button>
                  <style>{`
                    @keyframes spin {
                      to { transform: rotate(360deg); }
                    }
                  `}</style>
                </div>
              </div>
            </div>

            {/* Loaded Sources Section */}
{sources.length > 0 && (
  <div
    style={{
      borderTop: "2px solid rgba(226, 232, 240, 0.5)",
      paddingTop: "64px",
      animation: "slideUp 0.6s ease-out",
    }}
  >
    <div style={{ textAlign: "center", marginBottom: "40px" }}>
      <h3
        style={{
          fontSize: "32px",
          fontWeight: "800",
          color: "#0f172a",
          marginBottom: "12px",
          letterSpacing: "-0.02em",
        }}
      >
        Loaded Sources
      </h3>
      <p style={{ fontSize: "16px", color: "#64748b", fontWeight: "500" }}>
        Select data sources to include in your analysis
      </p>
    </div>

    {/* Sources List */}
    <div
      style={{
        display: "grid",
        gap: "16px",
        marginBottom: "48px",
        maxWidth: "900px",
        margin: "0 auto 48px",
      }}
    >
      {sources.map((s) => (
  <div
    key={s.id}
    className="source-card"
    style={{
      display: "flex",
      alignItems: "center",
      gap: "24px",
      padding: "24px 28px",
      background: selectedIds.includes(s.id)
  ? "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(37,99,235,0.06))"
  : "rgba(255,255,255,0.7)",
      borderRadius: "20px",
      border: "2px solid rgba(226,232,240,0.6)",
      cursor: "pointer",
    }}
    onClick={() =>
      setSelectedIds((prev) =>
        prev.includes(s.id)
          ? prev.filter((x) => x !== s.id)
          : [...prev, s.id]
      )
    }
  >
    {/* ✅ Selection Checkbox */}
<div
  style={{
    width: "24px",
    height: "24px",
    borderRadius: "6px",
    border: selectedIds.includes(s.id)
      ? "3px solid #3b82f6"
      : "3px solid #cbd5e1",
    background: selectedIds.includes(s.id) ? "#3b82f6" : "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  }}
>
  {selectedIds.includes(s.id) && (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )}
</div>

    <div style={{ flex: 1 }}>
      <div style={{ fontSize: "16px", fontWeight: 700 }}>
        {s.name}
      </div>
      <div style={{ fontSize: "13px", color: "#64748b" }}>
        {(s.totalRecords || s.records.length).toLocaleString()} records
      </div>
    </div>

    <button
      onClick={(e) => {
        e.stopPropagation();
        removeSource(s.id);
      }}
      style={{
        background: "#ef4444",
        color: "white",
        border: "none",
        borderRadius: "10px",
        width: "36px",
        height: "36px",
        fontSize: "20px",
        cursor: "pointer",
      }}
    >
      ×
    </button>
  </div>
))}

    </div>

    {/* Action Buttons */}
   <div
  style={{
    display: "flex",
    justifyContent: "center",
    gap: "24px",
    marginTop: "16px",
    flexWrap: "wrap",
  }}
>
  {/* Primary Action – Analysis */}
  {/* Create Analysis */}
<button
  disabled={selectedIds.length === 0}
  onClick={applyAnalysis}
  style={{
    background:
      selectedIds.length === 0
        ? "#cbd5e1"
        : "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    fontWeight: 700,
    padding: "16px 36px",
    borderRadius: "16px",
    border: "none",
    cursor: selectedIds.length === 0 ? "not-allowed" : "pointer",
  }}
>
  Create Analysis Report ({selectedIds.length})
</button>

{/* Compare ONLY when exactly 2 selected */}
{selectedIds.length === 2 && (
  <button
    onClick={() => {
      setComparisonIds(selectedIds);
      setComparisonMode(true);
    }}
    style={{
      background: "linear-gradient(135deg, #f97316, #ea580c)",
      color: "white",
      fontWeight: 700,
      padding: "16px 36px",
      borderRadius: "16px",
      border: "none",
      cursor: "pointer",
    }}
  >
    Compare Selected Imports
  </button>
)}

</div>

  </div>
)}

          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: "48px", opacity: 0.8 }}>
          <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.9)", fontWeight: "500" }}>
            © 2026 ETA Dashboard • Advanced Analytics Platform
          </p>
        </div>
      </div>
    </div>
  );
}