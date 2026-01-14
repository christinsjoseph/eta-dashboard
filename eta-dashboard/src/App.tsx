import { useState, useMemo } from "react";
import OverviewPage from "./pages/OverviewPage";
import CityDetailPage from "./pages/CityDetailPage";
import { parseEtaCsv } from "./data/csvParser";
import { aggregateByCity } from "./data/aggregations";
import type { EtaRecord } from "./types/eta";

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
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [mongoLoading, setMongoLoading] = useState(false);

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
    if (!fromDate || !toDate) return;
    setMongoLoading(true);
    try {
      // First, fetch aggregated data (fast)
      const res = await fetch("http://localhost:4000/api/eta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromRunId: runIdFromDate(fromDate),
          toRunId: runIdFromDate(toDate, true),
         mode: "full", // Get actual records
limit: 500000,  // Fast mode for overview
        }),
      });
      const response = await res.json();
      
      setSources((prev) => [
  ...prev,
  {
    id: `mongo-${Date.now()}`,
    name: `${response.collectionName} (${fromDate} → ${toDate})`,
    records: response.data || [], // Use actual records
    totalRecords: response.data?.length || 0,
  },
]);
    } catch (e) {
      console.error("Failed to fetch Mongo data:", e);
      alert("Failed to fetch Mongo data");
    } finally {
      setMongoLoading(false);
    }
  }

  function applyAnalysis() {
    setAppliedIds(selectedIds);
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
const allCities = useMemo(() => {
  return Array.from(new Set(mergedRecords.map((r) => r.city))).sort();
}, [mergedRecords]);

  if (selectedCity) {
    return (
      <CityDetailPage
        city={selectedCity}
        cities={allCities}              // ✅ FIX
      onCityChange={setSelectedCity}
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
                      onFocus={(e) => {
                        e.target.style.borderColor = "#10b981";
                        e.target.style.boxShadow = "0 0 0 4px rgba(16, 185, 129, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "rgba(203, 213, 225, 0.4)";
                        e.target.style.boxShadow = "none";
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
                      onFocus={(e) => {
                        e.target.style.borderColor = "#10b981";
                        e.target.style.boxShadow = "0 0 0 4px rgba(16, 185, 129, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "rgba(203, 213, 225, 0.4)";
                        e.target.style.boxShadow = "none";
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
                    disabled={!fromDate || !toDate || mongoLoading}
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
                          ? "linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(37, 99, 235, 0.06) 100%)"
                          : "rgba(255, 255, 255, 0.7)",
                        borderRadius: "20px",
                        border: selectedIds.includes(s.id)
                          ? "2px solid rgba(59, 130, 246, 0.5)"
                          : "2px solid rgba(226, 232, 240, 0.5)",
                        cursor: "pointer",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        boxShadow: selectedIds.includes(s.id)
                          ? "0 12px 40px rgba(59, 130, 246, 0.15)"
                          : "0 8px 24px rgba(0, 0, 0, 0.04)",
                      }}
                      onClick={() =>
                        setSelectedIds((prev) =>
                          prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id]
                        )
                      }
                    >
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "8px",
                          border: `3px solid ${selectedIds.includes(s.id) ? "#3b82f6" : "#cbd5e1"}`,
                          background: selectedIds.includes(s.id) ? "#3b82f6" : "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          transition: "all 0.2s ease",
                        }}
                      >
                        {selectedIds.includes(s.id) && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "17px", fontWeight: "700", color: "#0f172a", marginBottom: "4px" }}>
                          {s.name}
                        </div>
                        <div style={{ fontSize: "14px", color: "#64748b", fontWeight: "600" }}>
                          {(s.totalRecords || s.records.length).toLocaleString()} records loaded
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSource(s.id);
                        }}
                        className="delete-btn"
                        style={{
                          background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                          color: "white",
                          border: "none",
                          width: "44px",
                          height: "44px",
                          borderRadius: "14px",
                          fontSize: "24px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "600",
                          boxShadow: "0 8px 24px rgba(239, 68, 68, 0.3)",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ textAlign: "center" }}>
                  <button
                    style={{
                      background: selectedIds.length === 0
                        ? "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)"
                        : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: "white",
                      fontWeight: "700",
                      padding: "20px 56px",
                      borderRadius: "18px",
                      border: "none",
                      cursor: selectedIds.length === 0 ? "not-allowed" : "pointer",
                      fontSize: "17px",
                      letterSpacing: "0.02em",
                      boxShadow: selectedIds.length === 0
                        ? "0 12px 32px rgba(148, 163, 184, 0.3)"
                        : "0 16px 48px rgba(102, 126, 234, 0.4)",
                      transition: "all 0.3s ease",
                    }}
                    className={selectedIds.length === 0 ? "" : "primary-btn"}
                    disabled={selectedIds.length === 0}
                    onClick={applyAnalysis}
                  >
                    Create Analysis Report ({selectedIds.length} source{selectedIds.length !== 1 ? "s" : ""})
                  </button>
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