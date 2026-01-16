import OverviewPage from "./OverviewPage";
import { useRef } from "react";

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
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);

  const handleScroll = (source: 'left' | 'right') => (e: React.UIEvent<HTMLDivElement>) => {
    if (isSyncing.current) return;
    
    isSyncing.current = true;
    const sourceElement = e.currentTarget;
    const targetElement = source === 'left' ? rightPanelRef.current : leftPanelRef.current;
    
    if (targetElement) {
      targetElement.scrollTop = sourceElement.scrollTop;
    }
    
    setTimeout(() => {
      isSyncing.current = false;
    }, 0);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(15, 23, 42, 0.8)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          zIndex: 10,
          flexShrink: 0,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "20px",
              fontWeight: 800,
              background: "linear-gradient(135deg, #c084fc 0%, #60a5fa 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            Side-by-Side Comparison
          </h1>
          <p
            style={{
              marginTop: "4px",
              fontSize: "12px",
              color: "#94a3b8",
              fontWeight: 500,
            }}
          >
            {leftSource.name}{" "}
            <span style={{ color: "#c084fc", fontWeight: 700, padding: "0 6px" }}>vs</span>{" "}
            {rightSource.name}
          </p>
        </div>

        <button
          onClick={onExitComparison}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "white",
            padding: "8px 20px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.15)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          ← Exit
        </button>
      </header>

      {/* Main content area with side-by-side panels */}
      <div
        style={{
          flex: 1,
          display: "flex",
          gap: "16px",
          padding: "16px",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {/* LEFT PANEL */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "rgba(139, 92, 246, 0.05)",
            backdropFilter: "blur(10px)",
            borderRadius: "12px",
            border: "1px solid rgba(139, 92, 246, 0.3)",
            boxShadow: "0 8px 24px rgba(139, 92, 246, 0.1)",
            overflow: "hidden",
            minWidth: 0,
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(139,92,246,0.15)",
              borderBottom: "1px solid rgba(139, 92, 246, 0.3)",
              flexShrink: 0,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: 700,
                color: "#c084fc",
                letterSpacing: "-0.01em",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#c084fc",
                  boxShadow: "0 0 8px rgba(192, 132, 252, 0.5)",
                }}
              />
              {leftSource.name}
            </h2>
          </div>

          <div
            ref={leftPanelRef}
            onScroll={handleScroll('left')}
            style={{
              flex: 1,
              padding: "16px",
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
            width: "1px",
            background: "linear-gradient(180deg, transparent 0%, rgba(139,92,246,0.3) 50%, transparent 100%)",
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
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "rgba(15, 23, 42, 0.9)",
              border: "2px solid rgba(139, 92, 246, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              fontWeight: 700,
              color: "#a78bfa",
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
            background: "rgba(96, 165, 250, 0.05)",
            backdropFilter: "blur(10px)",
            borderRadius: "12px",
            border: "1px solid rgba(96, 165, 250, 0.3)",
            boxShadow: "0 8px 24px rgba(96, 165, 250, 0.1)",
            overflow: "hidden",
            minWidth: 0,
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(96,165,250,0.15)",
              borderBottom: "1px solid rgba(96, 165, 250, 0.3)",
              flexShrink: 0,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: 700,
                color: "#60a5fa",
                letterSpacing: "-0.01em",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#60a5fa",
                  boxShadow: "0 0 8px rgba(96, 165, 250, 0.5)",
                }}
              />
              {rightSource.name}
            </h2>
          </div>

          <div
            ref={rightPanelRef}
            onScroll={handleScroll('right')}
            style={{
              flex: 1,
              padding: "16px",
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