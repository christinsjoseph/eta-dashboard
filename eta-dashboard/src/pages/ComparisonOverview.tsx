import OverviewPage from "./OverviewPage";

type Props = {
  leftSource: any;
  rightSource: any;
  onCityClick: (city: string) => void;
  onExitComparison: () => void;
};

export default function ComparisonOverview({
  leftSource,
  rightSource,
  onCityClick,
  onExitComparison,
}: Props) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        padding: "24px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h1 style={{ color: "white", fontSize: 28, fontWeight: 900 }}>
          Import Comparison
        </h1>

        <button onClick={onExitComparison}>
          ← Exit Comparison
        </button>
      </div>

      {/* Two Overviews */}
      <div
  style={{
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 24,
    alignItems: "flex-start",
  }}
>
  {/* LEFT */}
  <div style={{ overflow: "hidden", borderRadius: 24 }}>
    <OverviewPage
  cityStats={null}
  records={leftSource.records}
  csvNames={[leftSource.name]}
  reportLabel="Left Import"
  totalRecords={leftSource.totalRecords}
  onCityClick={onCityClick}
  onBackToHome={onExitComparison}   // ✅ FIX
/>
  </div>

  {/* RIGHT */}
  <div style={{ overflow: "hidden", borderRadius: 24 }}>
    <OverviewPage
  cityStats={null}
  records={rightSource.records}
  csvNames={[rightSource.name]}
  reportLabel="Right Import"
  totalRecords={rightSource.totalRecords}
  onCityClick={onCityClick}
  onBackToHome={onExitComparison}   // ✅ FIX
/>

  </div>
</div>
    </div>
  );
}
