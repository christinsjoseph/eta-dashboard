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

  const cityStats = useMemo(() => aggregateByCity(mergedRecords), [mergedRecords]);

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
      const res = await fetch("http://localhost:4000/api/eta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromRunId: runIdFromDate(fromDate),
          toRunId: runIdFromDate(toDate, true),
        }),
      });
      const data = await res.json();
      
      // DEBUG LINES
      console.log("Raw API response:", data);
      console.log("First record from API:", data[0]);
      console.log("Keys in first record:", Object.keys(data[0] || {}));
      
      setSources((prev) => [
        ...prev,
        {
          id: `mongo-${Date.now()}`,
          name: `Mongo (${fromDate} → ${toDate})`,
          records: data,
        },
      ]);
    } catch (e) {
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

  if (selectedCity) {
    return (
      <CityDetailPage
        city={selectedCity}
        records={mergedRecords.filter((r) => r.city === selectedCity)}
        onBack={() => setSelectedCity(null)}
      />
    );
  }

  // ── STYLES ──────────────────────────────────────────────────────────────
  const glassCard = {
    background: "rgba(255, 255, 255, 0.65)",
    backdropFilter: "blur(24px) saturate(180%)",
    borderRadius: "32px",
    border: "1px solid rgba(255, 255, 255, 0.8)",
    boxShadow: "0 24px 60px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.08)",
    overflow: "hidden",
  };

  const cardSection = {
    padding: "48px 56px",
    borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
  };

  const primaryButton = {
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    color: "white",
    fontWeight: "600",
    padding: "16px 36px",
    borderRadius: "16px",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    boxShadow: "0 8px 24px rgba(59, 130, 246, 0.3)",
    transition: "all 0.2s ease",
  };

  const secondaryButton = {
    background: "rgba(255, 255, 255, 0.9)",
    color: "#1e293b",
    fontWeight: "600",
    padding: "16px 40px",
    borderRadius: "16px",
    border: "1px solid rgba(203, 213, 225, 0.5)",
    cursor: "pointer",
    fontSize: "16px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    transition: "all 0.2s ease",
  };

  const inputStyle = {
    padding: "16px 24px",
    borderRadius: "14px",
    border: "1px solid rgba(203, 213, 225, 0.5)",
    background: "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(8px)",
    width: "100%",
    fontSize: "15px",
    fontWeight: "500",
    color: "#1e293b",
    outline: "none",
    transition: "all 0.2s ease",
  };

  // ── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "64px 32px 80px",
        background: "linear-gradient(135deg, #dbeafe 0%, #e0f2fe 25%, #f0f9ff 50%, #fef9c3 100%)",
        backgroundAttachment: "fixed",
      }}
    >
      <div style={{ maxWidth: "1440px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <h1
            style={{
              fontSize: "64px",
              fontWeight: "900",
              background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #0ea5e9 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "12px",
              letterSpacing: "-0.03em",
            }}
          >
            ETA Dashboard
          </h1>
          <p
            style={{
              fontSize: "18px",
              color: "#64748b",
              fontWeight: "500",
            }}
          >
            Advanced analytics for performance tracking
          </p>
        </div>

        {appliedIds.length === 0 ? (
          // ── IMPORT + SOURCES + CREATE ANALYSIS ──
          <div style={glassCard}>
            {/* Import Section */}
            <div style={cardSection}>
              <div style={{ textAlign: "center", marginBottom: "48px" }}>
                <h2
                  style={{
                    fontSize: "36px",
                    fontWeight: "800",
                    color: "#0f172a",
                    marginBottom: "8px",
                  }}
                >
                  Import Data Sources
                </h2>
                <p style={{ fontSize: "16px", color: "#64748b" }}>
                  Upload CSV files or connect to MongoDB to get started
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
                  gap: "48px",
                  maxWidth: "1000px",
                  margin: "0 auto",
                }}
              >
                {/* CSV Upload */}
                <div
                  style={{
                    background: "linear-gradient(135deg, rgba(249, 250, 251, 0.8) 0%, rgba(255, 255, 255, 0.9) 100%)",
                    borderRadius: "24px",
                    padding: "40px 32px",
                    border: "1px solid rgba(226, 232, 240, 0.6)",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: "72px",
                      height: "72px",
                      background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                      borderRadius: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 24px",
                      boxShadow: "0 12px 32px rgba(59, 130, 246, 0.3)",
                    }}
                  >
                    <span style={{ fontSize: "32px" }}>📄</span>
                  </div>
                  <h3
                    style={{
                      fontSize: "24px",
                      fontWeight: "700",
                      color: "#0f172a",
                      marginBottom: "12px",
                    }}
                  >
                    Upload CSV Files
                  </h3>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#64748b",
                      marginBottom: "28px",
                      lineHeight: "1.6",
                    }}
                  >
                    Import multiple CSV files with ETA records
                  </p>
                  <label style={{ ...secondaryButton, display: "inline-block" }}>
                    Choose File(s)
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

                {/* MongoDB Import */}
                <div
                  style={{
                    background: "linear-gradient(135deg, rgba(249, 250, 251, 0.8) 0%, rgba(255, 255, 255, 0.9) 100%)",
                    borderRadius: "24px",
                    padding: "40px 32px",
                    border: "1px solid rgba(226, 232, 240, 0.6)",
                  }}
                >
                  <div
                    style={{
                      width: "72px",
                      height: "72px",
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      borderRadius: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 24px",
                      boxShadow: "0 12px 32px rgba(16, 185, 129, 0.3)",
                    }}
                  >
                    <span style={{ fontSize: "32px" }}>🗄️</span>
                  </div>
                  <h3
                    style={{
                      fontSize: "24px",
                      fontWeight: "700",
                      color: "#0f172a",
                      marginBottom: "12px",
                      textAlign: "center",
                    }}
                  >
                    Import from MongoDB
                  </h3>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#64748b",
                      marginBottom: "28px",
                      lineHeight: "1.6",
                      textAlign: "center",
                    }}
                  >
                    Connect to your database and fetch records by date range
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "13px",
                          fontWeight: "600",
                          color: "#475569",
                          marginBottom: "8px",
                        }}
                      >
                        From Date
                      </label>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "13px",
                          fontWeight: "600",
                          color: "#475569",
                          marginBottom: "8px",
                        }}
                      >
                        To Date
                      </label>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <button
                      style={{
                        ...primaryButton,
                        opacity: !fromDate || !toDate || mongoLoading ? 0.5 : 1,
                        cursor: !fromDate || !toDate || mongoLoading ? "not-allowed" : "pointer",
                        marginTop: "8px",
                      }}
                      disabled={!fromDate || !toDate || mongoLoading}
                      onClick={importMongo}
                    >
                      {mongoLoading ? "Importing..." : "Import Data"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Show sources + Create button only if something was loaded */}
            {sources.length > 0 && (
              <div style={{ ...cardSection, borderBottom: "none" }}>
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                  <h3
                    style={{
                      fontSize: "28px",
                      fontWeight: "700",
                      color: "#0f172a",
                      marginBottom: "8px",
                    }}
                  >
                    Loaded Sources
                  </h3>
                  <p style={{ fontSize: "15px", color: "#64748b" }}>
                    Select data sources to include in your analysis
                  </p>
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: "12px",
                    marginBottom: "40px",
                    maxWidth: "900px",
                    margin: "0 auto 40px",
                  }}
                >
                  {sources.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                        padding: "20px 24px",
                        background: selectedIds.includes(s.id)
                          ? "linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(37, 99, 235, 0.08) 100%)"
                          : "rgba(255, 255, 255, 0.5)",
                        borderRadius: "16px",
                        border: selectedIds.includes(s.id)
                          ? "2px solid rgba(59, 130, 246, 0.4)"
                          : "1px solid rgba(226, 232, 240, 0.6)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onClick={() =>
                        setSelectedIds((prev) =>
                          prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id]
                        )
                      }
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(s.id)}
                        onChange={() => {}}
                        style={{
                          width: "20px",
                          height: "20px",
                          cursor: "pointer",
                          accentColor: "#3b82f6",
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "16px", fontWeight: "600", color: "#0f172a" }}>
                          {s.name}
                        </div>
                        <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
                          {s.records.length.toLocaleString()} records
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSource(s.id);
                        }}
                        style={{
                          background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                          color: "white",
                          border: "none",
                          width: "40px",
                          height: "40px",
                          borderRadius: "12px",
                          fontSize: "20px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "600",
                          boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
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
                      ...primaryButton,
                      fontSize: "18px",
                      padding: "18px 48px",
                      opacity: selectedIds.length === 0 ? 0.5 : 1,
                      cursor: selectedIds.length === 0 ? "not-allowed" : "pointer",
                    }}
                    disabled={selectedIds.length === 0}
                    onClick={applyAnalysis}
                  >
                    Create Analysis Report ({selectedIds.length} source{selectedIds.length !== 1 ? "s" : ""})
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // ── Only analysis report ──
          <OverviewPage
            cityStats={cityStats}
            records={mergedRecords}
            csvNames={sources.filter((s) => appliedIds.includes(s.id)).map((s) => s.name)}
            reportLabel="ETA Analysis Report"
            onCityClick={setSelectedCity}
            onBackToHome={resetToHome}
          />
        )}
      </div>
    </div>
  );
}