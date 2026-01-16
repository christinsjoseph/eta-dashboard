import OverviewPage from "./OverviewPage";

type Props = {
  leftSource: {
    name: string;
    records: any[];
    totalRecords?: number;
  };
  rightSource: {
    name: string;
    records: any[];
    totalRecords?: number;
  };
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
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        background: "linear-gradient(135deg, #0a0f1e 0%, #020617 50%, #0f0a1e 100%)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Ambient glow effects */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: "-10%",
          width: "40%",
          height: "40%",
          background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
          filter: "blur(80px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          right: "-10%",
          width: "40%",
          height: "40%",
          background: "radial-gradient(circle, rgba(96,165,250,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
          filter: "blur(80px)",
        }}
      />

      {/* Header */}
      <header
        style={{
          padding: "24px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          zIndex: 10,
          flexShrink: 0,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              background: "linear-gradient(135deg, #c084fc 0%, #a78bfa 50%, #60a5fa 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Side-by-Side Comparison
          </h1>
          <p
            style={{
              marginTop: "6px",
              fontSize: "14px",
              color: "#94a3b8",
              fontWeight: 500,
              letterSpacing: "0.01em",
            }}
          >
            {leftSource.name}{" "}
            <span
              style={{
                color: "#c084fc",
                fontWeight: 700,
                padding: "0 8px",
              }}
            >
              vs
            </span>{" "}
            {rightSource.name}
          </p>
        </div>

        <button
          onClick={onExitComparison}
          style={{
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "white",
            padding: "12px 28px",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            letterSpacing: "0.01em",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.15)";
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          ← Exit Comparison
        </button>
      </header>

      {/* Main content area with side-by-side panels */}
      <div
        style={{
          flex: 1,
          display: "flex",
          gap: "24px",
          padding: "24px 40px 32px",
          overflow: "hidden",
          position: "relative",
          zIndex: 1,
          minHeight: 0,
        }}
      >
        {/* LEFT PANEL */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(24px)",
            borderRadius: "20px",
            border: "1px solid rgba(139, 92, 246, 0.2)",
            boxShadow:
              "0 20px 60px -15px rgba(139, 92, 246, 0.25), inset 0 1px 0 rgba(255,255,255,0.05)",
            overflow: "hidden",
            minWidth: 0,
          }}
        >
          <div
            style={{
              padding: "20px 28px",
              background:
                "linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(99,102,241,0.08) 100%)",
              borderBottom: "1px solid rgba(139, 92, 246, 0.2)",
              flexShrink: 0,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: 800,
                color: "#c084fc",
                letterSpacing: "-0.02em",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#c084fc",
                  boxShadow: "0 0 12px rgba(192, 132, 252, 0.6)",
                }}
              />
              {leftSource.name}
            </h2>
          </div>

          <div
            style={{
              flex: 1,
              padding: "24px 28px",
              overflow: "auto",
              minHeight: 0,
            }}
          >
            <OverviewPage
              cityStats={null}
              records={leftSource.records}
              csvNames={[leftSource.name]}
              reportLabel={leftSource.name}
              totalRecords={leftSource.totalRecords}
              onCityClick={onCityClick}
              onBackToHome={onExitComparison}
            />
          </div>
        </div>

        {/* Vertical divider */}
        <div
          style={{
            width: "2px",
            background:
              "linear-gradient(180deg, transparent 0%, rgba(139,92,246,0.4) 50%, transparent 100%)",
            flexShrink: 0,
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "rgba(15, 23, 42, 0.9)",
              border: "2px solid rgba(139, 92, 246, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: 700,
              color: "#a78bfa",
              backdropFilter: "blur(12px)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}
          >
            VS
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(24px)",
            borderRadius: "20px",
            border: "1px solid rgba(96, 165, 250, 0.2)",
            boxShadow:
              "0 20px 60px -15px rgba(96, 165, 250, 0.25), inset 0 1px 0 rgba(255,255,255,0.05)",
            overflow: "hidden",
            minWidth: 0,
          }}
        >
          <div
            style={{
              padding: "20px 28px",
              background:
                "linear-gradient(135deg, rgba(96,165,250,0.15) 0%, rgba(139,92,246,0.08) 100%)",
              borderBottom: "1px solid rgba(96, 165, 250, 0.2)",
              flexShrink: 0,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: 800,
                color: "#60a5fa",
                letterSpacing: "-0.02em",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#60a5fa",
                  boxShadow: "0 0 12px rgba(96, 165, 250, 0.6)",
                }}
              />
              {rightSource.name}
            </h2>
          </div>

          <div
            style={{
              flex: 1,
              padding: "24px 28px",
              overflow: "auto",
              minHeight: 0,
            }}
          >
            <OverviewPage
              cityStats={null}
              records={rightSource.records}
              csvNames={[rightSource.name]}
              reportLabel={rightSource.name}
              totalRecords={rightSource.totalRecords}
              onCityClick={onCityClick}
              onBackToHome={onExitComparison}
            />
          </div>
        </div>
      </div>
    </div>
  );
}