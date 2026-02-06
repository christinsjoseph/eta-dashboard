import { secureFetch } from "../utils/secureFetch";
import { useMemo, useState, useEffect, useRef } from "react";
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
import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet";
import polyline from "@mapbox/polyline";
import "leaflet/dist/leaflet.css";
import type { EtaRecord, ComparisonFlag, TimeBucket } from "../types/eta";
import L from "leaflet";

const startIcon = new L.DivIcon({
  className: "custom-start-icon",
  html: `<div style="
    width:10px;
    height:10px;
    background:#16a34a;
    border-radius:50%;
    border:2px solid white;
    box-shadow:0 0 0 2px #16a34a33;
  "></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

const endIcon = new L.DivIcon({
  className: "custom-end-icon",
  html: `<div style="
    width:10px;
    height:10px;
    background:#ef4444;
    border-radius:50%;
    border:2px solid white;
    box-shadow:0 0 0 2px #ef444433;
  "></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});
// Default map center per city (used for City Routes Map initial zoom)
const CITY_COORDS: Record<string, [number, number]> = {
  delhi: [28.6139, 77.2090],
  mumbai: [19.0760, 72.8777],
  bangalore: [12.9716, 77.5946],
  bengaluru: [12.9716, 77.5946],
  chennai: [13.0827, 80.2707],
  hyderabad: [17.3850, 78.4867],
  pune: [18.5204, 73.8567],
  kolkata: [22.5726, 88.3639],
  ahmedabad: [23.0225, 72.5714],
};


const ALL_BUCKETS: TimeBucket[] = ["Morning", "Afternoon", "Evening", "Midnight"];
const ALL_FLAGS: ComparisonFlag[] = ["Similar", "Underestimate", "Overestimate"];

type Props = {
  city: string;
  records: EtaRecord[];
  collectionName: string;
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
function decodePolyline(encoded: string) {
  return polyline.decode(encoded).map(([lat, lng]) => [lat, lng]);
}
function isValidCoord([lat, lng]: [number, number]) {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    lat !== 0 &&
    lng !== 0 &&
    lat >= 6 && lat <= 38 &&   // India latitude bounds
    lng >= 68 && lng <= 98     // India longitude bounds
  );
}

function CityRoutesViewController({
  cityCenter,
  routes,
}: {
  cityCenter: [number, number];
  routes: [number, number][][];
}) {
  const map = useMap();
  const hasZoomedRef = useRef(false);

  useEffect(() => {
    if (hasZoomedRef.current) return; // ✅ prevent re-zooming

    setTimeout(() => {
      map.invalidateSize();

      const cleanedRoutes = routes
        .map(route => route.filter(isValidCoord))
        .filter(route => route.length > 1);

      if (cleanedRoutes.length) {
        const allPoints = cleanedRoutes.flat();
        map.fitBounds(allPoints, { padding: [60, 60], maxZoom: 14 });
      } else {
        map.setView(cityCenter, 12);
      }

      hasZoomedRef.current = true; // ✅ lock after first zoom
    }, 300);
  }, [cityCenter, routes, map]);

  return null;
}



function ResizeMapOnOpen() {
  const map = useMap();

  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 250); // wait for modal layout
  }, [map]);

  return null;
}

function RouteMapViewController({ coords }: { coords: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (!coords.length) return;

    setTimeout(() => {
      map.invalidateSize();
      map.fitBounds(coords, { padding: [60, 60], maxZoom: 14 });
    }, 300);
  }, [coords, map]);

  return null;
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
export default function CityDetailPage({ city, records, collectionName, onBack }: Props) {
  const [comparison, setComparison] = useState<"mappls" | "oauth2">("mappls");
  const [activeCity, setActiveCity] = useState(
  city.toLowerCase()
);
const cityCenter: [number, number] =
  CITY_COORDS[activeCity] || [20, 78]; // fallback = India center

  const [selectedBuckets, setSelectedBuckets] = useState<TimeBucket[]>(ALL_BUCKETS);
  const [selectedFlags, setSelectedFlags] = useState<ComparisonFlag[]>(ALL_FLAGS);
  const [isChartExpanded, setIsChartExpanded] = useState(false);
  const [isTableExpanded, setIsTableExpanded] = useState(false);
  const [uidSearch, setUidSearch] = useState("");
  const [mapOpen, setMapOpen] = useState(false);
const [routeGeometry, setRouteGeometry] = useState<any | null>(null);

const [showMappls, setShowMappls] = useState(true);
const [showGoogle, setShowGoogle] = useState(true);
const [cityRoutesMapOpen, setCityRoutesMapOpen] = useState(false);
const [cityRoutes, setCityRoutes] = useState<{ geom: string; uids: string[] }[]>([]);

const [uidViewOpen, setUidViewOpen] = useState(false);
const [selectedUid, setSelectedUid] = useState<string | null>(null);
const [uidRecords, setUidRecords] = useState<EtaRecord[]>([]);
const [uidBuckets, setUidBuckets] = useState<TimeBucket[]>(ALL_BUCKETS);

// Decode polylines when geometry is loaded
const mapplsCoords = useMemo(
  () =>
    routeGeometry?.mapplsGeom
      ? decodePolyline(routeGeometry.mapplsGeom)
      : [],
  [routeGeometry]
);

const googleCoords = useMemo(
  () =>
    routeGeometry?.googleGeom
      ? decodePolyline(routeGeometry.googleGeom)
      : [],
  [routeGeometry]
);

const allCoords = [...mapplsCoords, ...googleCoords];

const decodedCityRoutes = useMemo(() => {
  return cityRoutes
    .map(route => {
      try {
        return {
          coords: decodePolyline(route.geom),
          uids: route.uids
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean) as { coords: [number, number][], uids: string[] }[];
}, [cityRoutes]);



const allCities = useMemo(() => {
  return Array.from(
    new Set(
      records.map((r: any) =>
        (r.city ?? r.City)?.toString().trim().toLowerCase()
      )
    )
  ).filter(Boolean);
}, [records]);


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

const cityFilteredRecords = useMemo(() => {
  return records.filter((r: any) => {
    const c =
      (r.city ?? r.City)?.toString().trim().toLowerCase();
    return c === activeCity;
  });
}, [records, activeCity]);

  const enrichedRecords = useMemo(
  () =>
    cityFilteredRecords.map((r) => {
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
  [cityFilteredRecords, comparison]
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
  link.download = `${activeCity}-filtered-records.csv`;
  link.click();

  URL.revokeObjectURL(url);
};
async function openRouteMap(uid: string) {
  try {
    const res = await secureFetch(
      `${import.meta.env.VITE_API_BASE}/api/eta/route-geometry`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionName,
          uid,
        }),
      }
    );

    const data = await res.json();

    setRouteGeometry(data);
    setMapOpen(true);
  } catch (err) {
    console.error("Failed to fetch route geometry", err);
  }
}

function openUidView(uid: string) {
  setSelectedUid(uid);

  const history = records.filter(r => r.uid === uid);

  setUidRecords(history);
  setUidViewOpen(true);
}
async function openCityRoutesMap() {
  try {
    const res = await secureFetch(
      `${import.meta.env.VITE_API_BASE}/api/eta/city-route-geometries`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionName,
          city: activeCity.trim(),

        }),
      }
    );

    const data = await res.json();

    // data.routes = [{ geom, uids }]
    setCityRoutes(data.routes || []);
    setCityRoutesMapOpen(true);
  } catch (err) {
    console.error("Failed to fetch city routes", err);
  }
}




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



const filteredUidRecords = useMemo(() => {
  return uidRecords
    .map(r => {
      const google = Number(r.googleETA ?? 0);
      const mappls = Number(r.mapplsETA ?? 0);

      const variation =
        google > 0 && mappls > 0
          ? ((mappls - google) / google) * 100
          : 0;

      return {
        ...r,
        timeBucket: getTimeBucket(r.runId),
        variation,
      };
    })
    .filter(r => uidBuckets.includes(r.timeBucket));
}, [uidRecords, uidBuckets]);

const uidStats = useMemo(() => {
  if (!filteredUidRecords.length) return { avg: 0, max: 0, min: 0 };

  const variations = filteredUidRecords.map(r => r.variation);

  return {
    avg: variations.reduce((a, b) => a + b, 0) / variations.length,
    max: Math.max(...variations),
    min: Math.min(...variations),
  };
}, [filteredUidRecords]);




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

  const comparisonLabel = comparison === "mappls" ? "Oauth1" : "Oauth2";

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
                    {activeCity.toUpperCase()} — ETA Analysis
                  </h1>
                  <p style={{ color: "#64748b", marginTop: "8px", fontSize: "1.05rem", fontWeight: 500 }}>
                    Showing {filteredRecords.length} of {cityFilteredRecords.length} records
                  </p>
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <select 
                    value={comparison} 
                    onChange={(e) => setComparison(e.target.value as "mappls" | "oauth2")} 
                    style={dropdownStyle}
                  >
                    <option value="mappls">Oauth1 vs Google</option>
                    <option value="oauth2">Oauth2 vs Google</option>
                  </select>
                  <button onClick={onBack} style={btnStyle}>← Back to Cities</button>
                  <button
  onClick={openCityRoutesMap}
  style={{
    ...btnStyle,
    background: "linear-gradient(135deg, #16a34a, #15803d)",
    color: "white",
  }}
>
  🗺️ City Routes Map
</button>

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
  value={activeCity}
  onChange={(e) => setActiveCity(e.target.value)}
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
  {allCities.map((c) => (
    <option key={c} value={c}>
      {c.replace(/\b\w/g, (x) => x.toUpperCase())}
    </option>
  ))}
</select>

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
  <option value="mappls">Oauth1 vs Google</option>
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
  Total Records: <b>{cityFilteredRecords.length}</b>

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
    minHeight: "800px",
  }}
>
            {/* Chart */}
<div
  style={{
    flex: "0 0 55%",
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
    <th style={{ ...thStyle, cursor: "default" }}>Actions</th>
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
                  <td style={{ padding: "12px 8px", textAlign: "center" }}>
  <div style={{ display: "flex", gap: "8px", justifyContent: "center", alignItems: "center" }}>
    {/* Map Button */}
    <button
      onClick={() => openRouteMap(r.uid)}
      style={{
        padding: "6px 14px",
        fontSize: "13px",
        fontWeight: 600,
        borderRadius: "8px",
        border: "1px solid #3b82f6",
        background: "linear-gradient(135deg, #3b82f6, #2563eb)",
        color: "white",
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: "0 2px 4px rgba(59, 130, 246, 0.2)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 4px 8px rgba(59, 130, 246, 0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 4px rgba(59, 130, 246, 0.2)";
      }}
    >
      🗺️ Map
    </button>

    {/* Compare Button */}
    <button
      onClick={() => openUidView(r.uid)}
      style={{
        padding: "6px 14px",
        fontSize: "13px",
        fontWeight: 600,
        borderRadius: "8px",
        border: "1px solid #10b981",
        background: "linear-gradient(135deg, #10b981, #059669)",
        color: "white",
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: "0 2px 4px rgba(16, 185, 129, 0.2)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 4px 8px rgba(16, 185, 129, 0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 4px rgba(16, 185, 129, 0.2)";
      }}
    >
      📊 Compare
    </button>
  </div>
</td>


                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    )}
        

{/* UID COMPARISON FULL SCREEN VIEW */}
{uidViewOpen && selectedUid && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "linear-gradient(135deg, #0f172a, #1e293b)",
      zIndex: 4000,
      padding: "32px",
      overflowY: "auto",
      color: "white",
    }}
  >
    {/* Header */}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
      <div style={{ flex: 1 }}>
        <h2 style={{ margin: 0, fontSize: "2rem", fontWeight: 800 }}>
          UID Comparison — {selectedUid}
        </h2>
        <p style={{ color: "#cbd5e1", marginTop: "6px", fontSize: "1rem" }}>
          Google vs Mappls ETA across all runs
        </p>
        <div style={{ 
          marginTop: "12px", 
          display: "flex", 
          gap: "20px",
          fontSize: "0.95rem",
          fontWeight: 600
        }}>
          <div style={{ 
            padding: "8px 16px", 
            background: "rgba(59, 130, 246, 0.2)", 
            borderRadius: "8px",
            border: "1px solid rgba(59, 130, 246, 0.3)"
          }}>
            <span style={{ color: "#94a3b8" }}>Total Iterations: </span>
            <span style={{ color: "#60a5fa", fontWeight: 800, fontSize: "1.1rem" }}>
              {uidRecords.length}
            </span>
          </div>
          <div style={{ 
            padding: "8px 16px", 
            background: "rgba(34, 197, 94, 0.2)", 
            borderRadius: "8px",
            border: "1px solid rgba(34, 197, 94, 0.3)"
          }}>
            <span style={{ color: "#94a3b8" }}>Filtered Iterations: </span>
            <span style={{ color: "#4ade80", fontWeight: 800, fontSize: "1.1rem" }}>
              {filteredUidRecords.length}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={() => setUidViewOpen(false)}
        style={{
          background: "#ef4444",
          color: "white",
          border: "none",
          borderRadius: "50%",
          width: "48px",
          height: "48px",
          fontSize: "1.8rem",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(239, 68, 68, 0.4)",
          transition: "all 0.2s ease",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow = "0 6px 16px rgba(239, 68, 68, 0.6)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.4)";
        }}
      >
        ×
      </button>
    </div>

    {/* Time Bucket Filter */}
    <div style={{ 
      marginBottom: "24px",
      padding: "16px",
      background: "rgba(30, 41, 59, 0.5)",
      borderRadius: "12px",
      border: "1px solid rgba(148, 163, 184, 0.2)"
    }}>
      <CompactFilterGroup
        title="Time Buckets"
        options={ALL_BUCKETS}
        selected={uidBuckets}
        onToggle={(b) =>
          setUidBuckets((prev) =>
            prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
          )
        }
      />
    </div>

   {/* Stats Row */}
<div style={{ display: "flex", gap: "20px", marginBottom: "30px", flexWrap: "wrap" }}>
  <div style={{ 
    background: "rgba(30, 41, 59, 0.6)", 
    padding: "20px 28px", 
    borderRadius: "16px",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    flex: "1",
    minWidth: "200px"
  }}>
    <div style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Avg Variation</div>
    <div style={{ fontSize: "28px", fontWeight: 800, color: "#facc15" }}>
      {uidStats.avg.toFixed(2)}%
    </div>
  </div>

  <div style={{ 
    background: "rgba(30, 41, 59, 0.6)", 
    padding: "20px 28px", 
    borderRadius: "16px",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    flex: "1",
    minWidth: "200px"
  }}>
    <div style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Max Overestimate</div>
    <div style={{ fontSize: "28px", fontWeight: 800, color: "#ef4444" }}>
      {uidStats.max.toFixed(2)}%
    </div>
  </div>

  <div style={{ 
    background: "rgba(30, 41, 59, 0.6)", 
    padding: "20px 28px", 
    borderRadius: "16px",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    flex: "1",
    minWidth: "200px"
  }}>
    <div style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Max Underestimate</div>
    <div style={{ fontSize: "28px", fontWeight: 800, color: "#22c55e" }}>
      {uidStats.min.toFixed(2)}%
    </div>
  </div>
</div>

{/* Chart */}
<div style={{ 
  height: "500px", 
  background: "rgba(30, 41, 59, 0.3)",
  borderRadius: "16px",
  padding: "20px",
  border: "1px solid rgba(148, 163, 184, 0.2)"
}}>
  <ResponsiveContainer width="100%" height="100%">
        <LineChart data={filteredUidRecords.map((r, i) => ({ ...r, index: i + 1 }))}>
          <CartesianGrid strokeDasharray="4 4" stroke="#334155" />
          <XAxis dataKey="index" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip 
            contentStyle={{
              background: "rgba(15, 23, 42, 0.95)",
              border: "1px solid rgba(148, 163, 184, 0.3)",
              borderRadius: "8px",
              color: "white"
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="googleETA"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={false}
            name="Google ETA"
          />
          <Line
            type="monotone"
            dataKey="mapplsETA"
            stroke="#22c55e"
            strokeWidth={3}
            dot={false}
            name="Mappls ETA"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
)}

        {/* ROUTE MAP MODAL */}
    {mapOpen && routeGeometry && (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.75)",
          zIndex: 5000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(4px)",
        }}
      >
        <div
          style={{
            width: "90%",
            height: "85%",
            background: "white",
            borderRadius: "20px",
            overflow: "hidden",
            position: "relative",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}
        >
          <button
            onClick={() => setMapOpen(false)}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              zIndex: 6000,
              background: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "50%",
              width: 44,
              height: 44,
              fontSize: 24,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(239, 68, 68, 0.4)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.1)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(239, 68, 68, 0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.4)";
            }}
          >
            ×
          </button>
          
          {/* Distance Difference Badge */}
<div
  style={{
    position: "absolute",
    top: 16,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 6000,
    background: "white",
    padding: "10px 18px",
    borderRadius: 12,
    fontWeight: 700,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    fontSize: "15px",
    border: "2px solid #e5e7eb",
  }}
>
  <span style={{ color: "#64748b" }}>Distance Δ: </span>
  <span style={{ 
    color: routeGeometry.mapplsDistance > routeGeometry.googleDistance ? "#ef4444" : "#10b981",
    fontWeight: 800
  }}>
    {routeGeometry.mapplsDistance && routeGeometry.googleDistance
      ? (routeGeometry.mapplsDistance - routeGeometry.googleDistance).toFixed(1)
      : "0"}{" "}
    m
  </span>
</div>

<div
  style={{
    position: "absolute",
    bottom: 20,
    left: 16,
    zIndex: 6000,
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  }}
>
  <button
    onClick={() => setShowMappls((v) => !v)}
    style={{
      padding: "8px 16px",
      borderRadius: "10px",
      border: `2px solid ${showMappls ? "#16a34a" : "#cbd5e1"}`,
      background: showMappls ? "#16a34a" : "white",
      color: showMappls ? "white" : "#16a34a",
      fontWeight: 700,
      cursor: "pointer",
      transition: "all 0.2s ease",
      boxShadow: showMappls ? "0 2px 8px rgba(22, 163, 74, 0.3)" : "0 2px 4px rgba(0,0,0,0.1)",
    }}
  >
    Mappls Route
  </button>

  <button
    onClick={() => setShowGoogle((v) => !v)}
    style={{
      padding: "8px 16px",
      borderRadius: "10px",
      border: `2px solid ${showGoogle ? "#2563eb" : "#cbd5e1"}`,
      background: showGoogle ? "#2563eb" : "white",
      color: showGoogle ? "white" : "#2563eb",
      fontWeight: 700,
      cursor: "pointer",
      transition: "all 0.2s ease",
      boxShadow: showGoogle ? "0 2px 8px rgba(37, 99, 235, 0.3)" : "0 2px 4px rgba(0,0,0,0.1)",
    }}
  >
    Google Route
  </button>
</div>

          <MapContainer
  center={[20, 78]}
  zoom={5}
  style={{ height: "100%", width: "100%" }}
>
            <TileLayer
  attribution="© MapmyIndia"
  url="https://mt4.mapmyindia.com/advancedmaps/v1/6e8l8fqpmlc8d4t3d7zwdttpgedmda6i/retina_map/{z}/{x}/{y}.png"
/>
<RouteMapViewController coords={allCoords.filter(isValidCoord)} />

            
            {/* Start & End Markers for Mappls */}
{showMappls && mapplsCoords.length > 0 && (
  <>
    <Marker position={mapplsCoords[0]} icon={startIcon} />
    <Marker position={mapplsCoords[mapplsCoords.length - 1]} icon={endIcon} />
  </>
)}

{/* Start & End Markers for Google */}
{showGoogle && googleCoords.length > 0 && (
  <>
    <Marker position={googleCoords[0]} icon={startIcon} />
    <Marker position={googleCoords[googleCoords.length - 1]} icon={endIcon} />
  </>
)}

           {showMappls && routeGeometry.mapplsGeom && (
  <Polyline
    positions={mapplsCoords}
    pathOptions={{ color: "#16a34a", weight: 5 }}
  />
)}

            {showGoogle && routeGeometry.googleGeom && (
  <Polyline
    positions={googleCoords}
    pathOptions={{ color: "#2563eb", weight: 5 }}
  />
)}

          </MapContainer>
        </div>
      </div>
    )}
{/* CITY ROUTES MAP MODAL */}
{cityRoutesMapOpen && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.75)",
      zIndex: 5500,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backdropFilter: "blur(4px)",
    }}
  >
    <div
      style={{
        width: "95%",
        height: "90%",
        background: "white",
        borderRadius: "20px",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <button
        onClick={() => setCityRoutesMapOpen(false)}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 6000,
          background: "#ef4444",
          color: "white",
          border: "none",
          borderRadius: "50%",
          width: 44,
          height: 44,
          fontSize: 24,
          cursor: "pointer",
        }}
      >
        ×
      </button>

      <MapContainer style={{ height: "100%", width: "100%" }} zoomControl={true}>

        <TileLayer
          attribution="© MapmyIndia"
          url="https://mt4.mapmyindia.com/advancedmaps/v1/6e8l8fqpmlc8d4t3d7zwdttpgedmda6i/retina_map/{z}/{x}/{y}.png"
        />
        <CityRoutesViewController
  cityCenter={cityCenter}
  routes={decodedCityRoutes.map(r => r.coords)}
/>

  <ResizeMapOnOpen />



        {/* Draw each unique route */}
        {decodedCityRoutes.map((route, idx) => {
  const safeCoords = route.coords.filter(isValidCoord);
  if (safeCoords.length < 2) return null;

  return (
    <Polyline
      key={idx}
      positions={safeCoords}
      pathOptions={{
        color: `hsl(${(idx * 67) % 360}, 70%, 45%)`,
        weight: 5,
        opacity: 0.9,
      }}
      eventHandlers={{
  click: (e) => {
    const map = (e.target as any)._map as L.Map;
    const uniqueUids = [...new Set(route.uids)];

    L.popup()
      .setLatLng(e.latlng)
      .setContent(`<b>UID(s)</b><br/>${uniqueUids.join(", ")}`)
      .openOn(map);
  },
}}
    />
  );
})}


      </MapContainer>
    </div>
  </div>
)}
  </div>
</div>
);
}
