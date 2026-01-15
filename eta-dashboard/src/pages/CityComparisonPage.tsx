import CityDetailPage from "./CityDetailPage";

type Props = {
  city: string;
  leftSource: any;
  rightSource: any;
  onBackToOverview: () => void;
  onExitComparison: () => void;
};

export default function CityComparisonPage({
  city,
  leftSource,
  rightSource,
  onBackToOverview,
  onExitComparison,
}: Props) {
  const leftRecords = leftSource.records.filter(
    (r: any) => r.city?.toLowerCase() === city
  );

  const rightRecords = rightSource.records.filter(
    (r: any) => r.city?.toLowerCase() === city
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        padding: 24,
      }}
    >
      {/* 🔒 HIDE INNER BACK BUTTONS FROM CityDetailPage */}
      <style>{`
        .comparison-city-wrapper button {
          display: none !important;
        }
      `}</style>

      {/* 🔝 TOP CONTROLS (ONLY BACK THAT SHOULD EXIST) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <button
          onClick={onBackToOverview}
          style={{
            background: "white",
            border: "none",
            borderRadius: 12,
            padding: "10px 20px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          ← Back to Cities
        </button>

        <button
          onClick={onExitComparison}
          style={{
            background: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: 12,
            padding: "10px 20px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          ✕ Exit Comparison
        </button>
      </div>

      {/* 🏙 CITY TITLE */}
      <h2
        style={{
          color: "white",
          marginBottom: 24,
          fontSize: 26,
          fontWeight: 800,
        }}
      >
        City Comparison: {city.toUpperCase()}
      </h2>

      {/* 🆚 SIDE-BY-SIDE CITY DETAILS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
        }}
      >
        {/* LEFT */}
        <div
          className="comparison-city-wrapper"
          style={{ borderRadius: 24, overflow: "hidden" }}
        >
          <CityDetailPage
            city={city}
            records={leftRecords}
            onBack={() => {}}
          />
        </div>

        {/* RIGHT */}
        <div
          className="comparison-city-wrapper"
          style={{ borderRadius: 24, overflow: "hidden" }}
        >
          <CityDetailPage
            city={city}
            records={rightRecords}
            onBack={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
