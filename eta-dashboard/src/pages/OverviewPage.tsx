import { useMemo, useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

type Props = {
  cityStats: any[];
  records: any[];
  csvNames: string[];
  reportLabel: string;
  onCityClick: (city: string) => void;
  onBackToHome: () => void;
};

export default function OverviewPage({
  cityStats,
  records,
  csvNames,
  reportLabel,
  onCityClick,
  onBackToHome,
}: Props) {
  const [comparison, setComparison] = useState<"mappls" | "oauth2">("mappls");
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    setTimeout(() => setMounted(true), 50);
  }, []);

  const validatedCityStats = useMemo(() => {
    if (!records?.length) return [];
    const cityMap = new Map<string, any>();
    records.forEach((r) => {
      const city = r.city || r.City || "Unknown";
      if (!cityMap.has(city)) {
        cityMap.set(city, { city, totalOrders: 0, similarCount: 0, overCount: 0, underCount: 0 });
      }
      const stats = cityMap.get(city);
      stats.totalOrders++;
      const flag = comparison === "mappls" ? r.mapplsComparisonFlag : r.oauth2ComparisonFlag;
      if (flag === "Similar") stats.similarCount++;
      else if (flag === "Underestimate") stats.underCount++;
      else if (flag === "Overestimate") stats.overCount++;
    });
    return Array.from(cityMap.values());
  }, [records, comparison]);

  const stackedChartData = useMemo(() => {
    return (validatedCityStats || []).map((cs = {}) => {
      const total = Number(cs.totalOrders) || 0;
      return {
        city: cs.city || "Unknown",
        Similar: total > 0 ? parseFloat(((Number(cs.similarCount) / total) * 100).toFixed(1)) : 0,
        Overestimate: total > 0 ? parseFloat(((Number(cs.overCount) / total) * 100).toFixed(1)) : 0,
        Underestimate: total > 0 ? parseFloat(((Number(cs.underCount) / total) * 100).toFixed(1)) : 0,
        similarCount: cs.similarCount,
        overCount: cs.overCount,
        underCount: cs.underCount,
        total,
      };
    });
  }, [validatedCityStats]);

  const totalOrders = records?.length || 0;

  const avgMapplsGoogleVariation = useMemo(() => {
    if (!totalOrders) return "0.00";
    let sum = 0, count = 0;
    records.forEach((r) => {
      const mappls = Number(r.mapplsETA ?? 0);
      const google = Number(r.googleETA ?? 0);
      if (google > 0) {
        sum += ((mappls - google) / google) * 100;
        count++;
      }
    });
    return count > 0 ? (sum / count).toFixed(2) : "0.00";
  }, [records, totalOrders]);

  const avgOauth2GoogleVariation = useMemo(() => {
    if (!totalOrders) return "0.00";
    let sum = 0, count = 0;
    records.forEach((r) => {
      const oauth2 = Number(r.oauth2ETA ?? 0);
      const google = Number(r.googleETA ?? 0);
      if (google > 0 && oauth2 > 0) {
        sum += ((oauth2 - google) / google) * 100;
        count++;
      }
    });
    return count > 0 ? (sum / count).toFixed(2) : "0.00";
  }, [records, totalOrders]);

  const pieData = useMemo(() => {
    let similar = 0, over = 0, under = 0;
    records.forEach((r) => {
      const flag = comparison === "mappls" ? r.mapplsComparisonFlag : r.oauth2ComparisonFlag;
      if (flag === "Similar") similar++;
      else if (flag === "Underestimate") under++;
      else if (flag === "Overestimate") over++;
    });
    return [
      { name: "Similar", value: similar, color: "#10b981" },
      { name: "Overestimate", value: over, color: "#f59e0b" },
      { name: "Underestimate", value: under, color: "#ef4444" },
    ];
  }, [records, comparison]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      const data = payload[0].payload;
      return (
        <div style={{ background: "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 250, 255, 0.98) 100%)", padding: "20px 24px", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.6)", boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2), 0 0 1px rgba(255, 255, 255, 0.5) inset", backdropFilter: "blur(20px)" }}>
          <p style={{ fontWeight: "800", marginBottom: "16px", color: "#0f172a", fontSize: "15px" }}>{data.city}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "14px", height: "14px", background: "#10b981", borderRadius: "4px", boxShadow: "0 2px 8px rgba(16, 185, 129, 0.4)" }} />
              <span style={{ fontSize: "14px", color: "#475569", fontWeight: "600" }}>Similar: <strong style={{ color: "#0f172a" }}>{data.Similar}%</strong> ({data.similarCount})</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "14px", height: "14px", background: "#f59e0b", borderRadius: "4px", boxShadow: "0 2px 8px rgba(245, 158, 11, 0.4)" }} />
              <span style={{ fontSize: "14px", color: "#475569", fontWeight: "600" }}>Overestimate: <strong style={{ color: "#0f172a" }}>{data.Overestimate}%</strong> ({data.overCount})</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "14px", height: "14px", background: "#ef4444", borderRadius: "4px", boxShadow: "0 2px 8px rgba(239, 68, 68, 0.4)" }} />
              <span style={{ fontSize: "14px", color: "#475569", fontWeight: "600" }}>Underestimate: <strong style={{ color: "#0f172a" }}>{data.Underestimate}%</strong> ({data.underCount})</span>
            </div>
          </div>
          <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(226, 232, 240, 0.5)", fontSize: "13px", color: "#64748b", fontWeight: "600" }}>Total: <strong style={{ color: "#0f172a" }}>{data.total}</strong></div>
        </div>
      );
    }
    return null;
  };

  const glassCard: React.CSSProperties = {
    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.8) 100%)",
    backdropFilter: "blur(40px) saturate(180%)",
    borderRadius: "32px",
    border: "1px solid rgba(255, 255, 255, 0.5)",
    boxShadow: "0 32px 80px rgba(0, 0, 0, 0.1), 0 0 1px rgba(255, 255, 255, 0.8) inset",
    padding: "48px 56px",
    marginBottom: "32px",
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(20px)",
    transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
  };

  const statCard: React.CSSProperties = {
    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 250, 255, 0.9) 100%)",
    borderRadius: "24px",
    padding: "36px",
    border: "1px solid rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    boxShadow: "0 16px 48px rgba(0, 0, 0, 0.08), 0 0 1px rgba(255, 255, 255, 0.6) inset",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    cursor: "default",
  };

  const primaryButton: React.CSSProperties = {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    fontWeight: "700",
    padding: "16px 36px",
    borderRadius: "16px",
    border: "none",
    cursor: "pointer",
    fontSize: "15px",
    letterSpacing: "0.02em",
    boxShadow: "0 12px 32px rgba(102, 126, 234, 0.4), 0 0 1px rgba(255, 255, 255, 0.3) inset",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  };

  const dropdownStyle: React.CSSProperties = {
    padding: "12px 20px",
    borderRadius: "14px",
    border: "1px solid rgba(102, 126, 234, 0.3)",
    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 250, 255, 0.95) 100%)",
    fontSize: "14px",
    fontWeight: "700",
    color: "#0f172a",
    cursor: "pointer",
    outline: "none",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.05)",
    transition: "all 0.2s ease",
  };

  if (!records?.length) {
    return <div style={glassCard}><p style={{ textAlign: "center", color: "#64748b", fontSize: "18px", fontWeight: "600" }}>No records available</p></div>;
  }

  const comparisonLabel = comparison === "mappls" ? "Mappls vs Google" : "Oauth2 vs Google";

  return (
    <div style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)", minHeight: "100vh", padding: "40px 24px" }}>
      <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
        <div style={{ marginBottom: "32px", display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
          <button onClick={onBackToHome} style={primaryButton} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(102, 126, 234, 0.5)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(102, 126, 234, 0.4)"; }}>← Back</button>
          <div>
            <h2 style={{ fontSize: "36px", fontWeight: "900", color: "white", marginBottom: "8px", letterSpacing: "-0.03em", textShadow: "0 2px 20px rgba(0, 0, 0, 0.2)" }}>{reportLabel}</h2>
            <p style={{ fontSize: "15px", color: "rgba(255, 255, 255, 0.95)", fontWeight: "600", textShadow: "0 1px 4px rgba(0, 0, 0, 0.15)" }}>Sources: {csvNames.join(", ")} • {totalOrders.toLocaleString()} records</p>
          </div>
        </div>

        <div style={glassCard}>
          <h3 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", marginBottom: "40px", textAlign: "center", letterSpacing: "-0.02em" }}>Overall Summary</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "28px" }}>
            <div style={statCard} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 24px 64px rgba(0, 0, 0, 0.12)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 16px 48px rgba(0, 0, 0, 0.08)"; }}>
              <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em" }}>Total Records</div>
              <div style={{ fontSize: "44px", fontWeight: "900", color: "#0f172a", letterSpacing: "-0.02em" }}>{totalOrders.toLocaleString()}</div>
            </div>
            <div style={statCard} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 24px 64px rgba(0, 0, 0, 0.12)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 16px 48px rgba(0, 0, 0, 0.08)"; }}>
              <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em" }}>Mappls Variation</div>
              <div style={{ fontSize: "44px", fontWeight: "900", letterSpacing: "-0.02em", color: parseFloat(avgMapplsGoogleVariation) > 0 ? "#ef4444" : parseFloat(avgMapplsGoogleVariation) < 0 ? "#f59e0b" : "#10b981" }}>{avgMapplsGoogleVariation}%</div>
              <div style={{ fontSize: "13px", color: "#64748b", marginTop: "8px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>{parseFloat(avgMapplsGoogleVariation) > 0 ? "Overestimate" : parseFloat(avgMapplsGoogleVariation) < 0 ? "Underestimate" : "Similar"}</div>
            </div>
            <div style={statCard} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 24px 64px rgba(0, 0, 0, 0.12)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 16px 48px rgba(0, 0, 0, 0.08)"; }}>
              <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em" }}>Oauth2 Variation</div>
              <div style={{ fontSize: "44px", fontWeight: "900", letterSpacing: "-0.02em", color: parseFloat(avgOauth2GoogleVariation) > 0 ? "#ef4444" : parseFloat(avgOauth2GoogleVariation) < 0 ? "#f59e0b" : "#10b981" }}>{avgOauth2GoogleVariation}%</div>
              <div style={{ fontSize: "13px", color: "#64748b", marginTop: "8px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>{parseFloat(avgOauth2GoogleVariation) > 0 ? "Overestimate" : parseFloat(avgOauth2GoogleVariation) < 0 ? "Underestimate" : "Similar"}</div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", marginBottom: "32px" }}>
          <div style={glassCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "12px" }}>
              <h3 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>City Statistics</h3>
              <select value={comparison} onChange={(e) => setComparison(e.target.value as "mappls" | "oauth2")} style={dropdownStyle}><option value="mappls">Mappls vs Google</option><option value="oauth2">Oauth2 vs Google</option></select>
            </div>
            <p style={{ fontSize: "14px", color: "#64748b", textAlign: "center", marginBottom: "32px", fontWeight: "600" }}>{comparisonLabel} ETA</p>
            <div style={{ overflowX: "auto", maxHeight: "500px", overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ position: "sticky", top: 0, background: "linear-gradient(135deg, rgba(249, 250, 251, 0.98) 0%, rgba(255, 255, 255, 0.98) 100%)", backdropFilter: "blur(12px)" }}>
                  <tr style={{ borderBottom: "2px solid rgba(226, 232, 240, 0.8)" }}>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontWeight: "800", color: "#0f172a", fontSize: "13px", letterSpacing: "0.05em", textTransform: "uppercase" }}>City</th>
                    <th style={{ padding: "16px 20px", textAlign: "center", fontWeight: "800", color: "#0f172a", fontSize: "13px" }}>Total</th>
                    <th style={{ padding: "16px 20px", textAlign: "center", fontWeight: "800", color: "#10b981", fontSize: "13px" }}>Similar</th>
                    <th style={{ padding: "16px 20px", textAlign: "center", fontWeight: "800", color: "#f59e0b", fontSize: "13px" }}>Over</th>
                    <th style={{ padding: "16px 20px", textAlign: "center", fontWeight: "800", color: "#ef4444", fontSize: "13px" }}>Under</th>
                    <th style={{ padding: "16px 20px", textAlign: "center", fontWeight: "800", color: "#0f172a", fontSize: "13px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {validatedCityStats.map((cs, idx) => (
                    <tr key={cs?.city || idx} style={{ borderBottom: "1px solid rgba(226, 232, 240, 0.4)" }}>
                      <td style={{ padding: "16px 20px", fontWeight: "700", color: "#0f172a", fontSize: "14px" }}>{cs?.city || "Unknown"}</td>
                      <td style={{ padding: "16px 20px", textAlign: "center", fontWeight: "700", fontSize: "14px" }}>{(cs?.totalOrders || 0).toLocaleString()}</td>
                      <td style={{ padding: "16px 20px", textAlign: "center", fontWeight: "600", fontSize: "14px" }}>{cs?.similarCount || 0}<br/><span style={{ fontSize: "12px", color: "#64748b" }}>({cs?.totalOrders > 0 ? ((cs.similarCount / cs.totalOrders) * 100).toFixed(1) : 0}%)</span></td>
                      <td style={{ padding: "16px 20px", textAlign: "center", fontWeight: "600", fontSize: "14px" }}>{cs?.overCount || 0}<br/><span style={{ fontSize: "12px", color: "#64748b" }}>({cs?.totalOrders > 0 ? ((cs.overCount / cs.totalOrders) * 100).toFixed(1) : 0}%)</span></td>
                      <td style={{ padding: "16px 20px", textAlign: "center", fontWeight: "600", fontSize: "14px" }}>{cs?.underCount || 0}<br/><span style={{ fontSize: "12px", color: "#64748b" }}>({cs?.totalOrders > 0 ? ((cs.underCount / cs.totalOrders) * 100).toFixed(1) : 0}%)</span></td>
                      <td style={{ padding: "16px 20px", textAlign: "center" }}><button onClick={() => onCityClick(cs?.city)} style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", padding: "8px 20px", fontSize: "13px", fontWeight: "700", border: "none", borderRadius: "12px", cursor: "pointer", boxShadow: "0 6px 20px rgba(102, 126, 234, 0.35)" }}>View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={glassCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "12px" }}>
              <h3 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>Distribution</h3>
              <select value={comparison} onChange={(e) => setComparison(e.target.value as "mappls" | "oauth2")} style={dropdownStyle}><option value="mappls">Mappls vs Google</option><option value="oauth2">Oauth2 vs Google</option></select>
            </div>
            <p style={{ fontSize: "14px", color: "#64748b", textAlign: "center", marginBottom: "32px", fontWeight: "600" }}>{comparisonLabel} ETA</p>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={(entry) => `${totalOrders > 0 ? ((entry.value / totalOrders) * 100).toFixed(1) : "0.0"}%`} innerRadius={0} outerRadius={100} paddingAngle={4} cornerRadius={10} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2))" }} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 250, 255, 0.98) 100%)", border: "1px solid rgba(255, 255, 255, 0.6)", borderRadius: "12px", boxShadow: "0 12px 40px rgba(0, 0, 0, 0.15)", backdropFilter: "blur(20px)", fontWeight: "600" }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", justifyContent: "center", gap: "32px", marginTop: "28px", flexWrap: "wrap" }}>
              {pieData.map((entry) => (
                <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "18px", height: "18px", background: entry.color, borderRadius: "6px", boxShadow: `0 4px 12px ${entry.color}50` }} />
                  <span style={{ fontSize: "15px", fontWeight: "700" }}>{entry.name}: <span style={{ color: "#0f172a" }}>{entry.value}</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={glassCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", gap: "12px" }}>
            <h3 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>City-wise ETA Accuracy</h3>
            <select value={comparison} onChange={(e) => setComparison(e.target.value as "mappls" | "oauth2")} style={dropdownStyle}><option value="mappls">Mappls vs Google</option><option value="oauth2">Oauth2 vs Google</option></select>
          </div>
          {stackedChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={450}>
              <BarChart data={stackedChartData} margin={{ top: 30, right: 30, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(203, 213, 225, 0.3)" vertical={false} />
                <XAxis dataKey="city" angle={-45} textAnchor="end" height={100} tick={{ fill: "#475569", fontSize: 12, fontWeight: 600 }} interval={0} />
                <YAxis tick={{ fill: "#475569", fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} label={{ value: "Percentage (%)", angle: -90, position: "insideLeft", fill: "#475569", fontSize: 13, fontWeight: 700 }} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: "20px", fontWeight: 700 }} iconType="square" />
                <Bar dataKey="Similar" stackId="a" fill="#10b981" radius={[8, 8, 0, 0]} barSize={28} style={{ filter: "drop-shadow(0px 6px 10px rgba(16, 185, 129, 0.3))" }} />
                <Bar dataKey="Overestimate" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} barSize={28} style={{ filter: "drop-shadow(0px 6px 10px rgba(245, 158, 11, 0.3))" }} />
                <Bar dataKey="Underestimate" stackId="a" fill="#ef4444" radius={[0, 0, 8, 8]} barSize={28} style={{ filter: "drop-shadow(0px 6px 10px rgba(239, 68, 68, 0.3))" }} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p style={{ textAlign: "center", color: "#64748b" }}>No data</p>}
        </div>
        {/* All Records Section */}
        <div style={glassCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "12px" }}>
            <h3 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>All Records ({totalOrders})</h3>
            <select value={comparison} onChange={(e) => setComparison(e.target.value as "mappls" | "oauth2")} style={dropdownStyle}>
              <option value="mappls">Mappls vs Google</option>
              <option value="oauth2">Oauth2 vs Google</option>
            </select>
          </div>
          <p style={{ fontSize: "14px", color: "#64748b", textAlign: "center", marginBottom: "32px", fontWeight: "600" }}>
            Showing {comparisonLabel} comparison
          </p>
          <div style={{ overflowX: "auto", maxHeight: "600px", overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ position: "sticky", top: 0, background: "linear-gradient(135deg, rgba(249, 250, 251, 0.98) 0%, rgba(255, 255, 255, 0.98) 100%)", backdropFilter: "blur(12px)" }}>
                <tr style={{ borderBottom: "2px solid rgba(226, 232, 240, 0.8)" }}>
                  <th style={{ padding: "16px 20px", textAlign: "left", fontWeight: "800", color: "#0f172a", fontSize: "13px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Record ID</th>
                  <th style={{ padding: "16px 20px", textAlign: "left", fontWeight: "800", color: "#0f172a", fontSize: "13px", letterSpacing: "0.05em", textTransform: "uppercase" }}>City</th>
                  <th style={{ padding: "16px 20px", textAlign: "center", fontWeight: "800", color: "#0f172a", fontSize: "13px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Google</th>
                  <th style={{ padding: "16px 20px", textAlign: "center", fontWeight: "800", color: "#0f172a", fontSize: "13px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    {comparison === "mappls" ? "Mappls" : "Oauth2"}
                  </th>
                  <th style={{ padding: "16px 20px", textAlign: "center", fontWeight: "800", color: "#0f172a", fontSize: "13px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Difference</th>
                  <th style={{ padding: "16px 20px", textAlign: "center", fontWeight: "800", color: "#0f172a", fontSize: "13px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, idx) => {
                  const google = Number(record.googleETA ?? 0);
                  const compared = comparison === "mappls" ? Number(record.mapplsETA ?? 0) : Number(record.oauth2ETA ?? 0);
                  const diff = compared - google;
                  const flag = comparison === "mappls" ? record.mapplsComparisonFlag : record.oauth2ComparisonFlag;
                  const color = flag === "Similar" ? "#10b981" : flag === "Overestimate" ? "#f59e0b" : "#ef4444";
                  
                  return (
                    <tr key={`${record.runId || 'record'}-${record.uid || idx}`} style={{ borderBottom: "1px solid rgba(226, 232, 240, 0.4)" }}>
                      <td style={{ padding: "16px 20px", fontSize: "14px", color: "#475569", fontWeight: "600" }}>{record.uid || idx + 1}</td>
                      <td style={{ padding: "16px 20px", fontSize: "14px", color: "#0f172a", fontWeight: "700" }}>{record.city || "-"}</td>
                      <td style={{ padding: "16px 20px", textAlign: "center", fontSize: "14px", color: "#475569", fontWeight: "600" }}>{google.toFixed(1)}</td>
                      <td style={{ padding: "16px 20px", textAlign: "center", fontSize: "14px", color: "#475569", fontWeight: "600" }}>{compared.toFixed(1)}</td>
                      <td style={{ padding: "16px 20px", textAlign: "center", fontSize: "14px", fontWeight: "700", color: diff > 0 ? "#ef4444" : diff < 0 ? "#f59e0b" : "#10b981" }}>
                        {diff > 0 ? "+" : ""}{diff.toFixed(1)}
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: "center" }}>
                        <span style={{ background: `${color}20`, color, padding: "6px 16px", borderRadius: "14px", fontSize: "13px", fontWeight: "700", textTransform: "capitalize", border: `1px solid ${color}40` }}>
                          {flag || "-"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}