import { useState } from "react";
import LoadingBar from "./LoadingBar";

type Props = {
  onImport: (fromRunId?: string, toRunId?: string, reportLabel?: string) => void;
  loading: boolean;
};

export default function MongoImportPanel({ onImport, loading }: Props) {
  const [fromRunId, setFromRunId] = useState("");
  const [toRunId, setToRunId] = useState("");

  // Helper to format date in nice Indian style: "11 Jan 2026"
  const formatNiceDate = (date: Date = new Date()) => {
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  function lastNDays(days: number) {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days);

    const toId = to
      .toISOString()
      .slice(0, 19)
      .replace(/[-:T]/g, "")
      .slice(0, 15);

    const fromId = from
      .toISOString()
      .slice(0, 19)
      .replace(/[-:T]/g, "")
      .slice(0, 15);

    const label = `Last ${days} days • ${formatNiceDate(to)}`;

    onImport(fromId, toId, label);
  }

  const handleAllRecords = () => {
    const label = `All Records • ${formatNiceDate()}`;
    onImport(undefined, undefined, label);
  };

  const handleCustomRange = () => {
    if (!fromRunId || !toRunId) return;

    // Optional: Try to make it a bit more informative if possible
    let rangeHint = "";
    if (fromRunId.length >= 8 && toRunId.length >= 8) {
      const fromDate = fromRunId.slice(0, 8); // YYYYMMDD
      const toDate = toRunId.slice(0, 8);
      if (fromDate === toDate) {
        rangeHint = `Date: ${fromDate.slice(6,8)}/${fromDate.slice(4,6)}/${fromDate.slice(0,4)} • `;
      }
    }

    const label = `${rangeHint}Custom range • ${formatNiceDate()}`;

    onImport(fromRunId, toRunId, label);
  };

  return (
    <div style={{ marginTop: 20 }}>
      <h3>Import from MongoDB</h3>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={handleAllRecords} disabled={loading}>
          All Records
        </button>
        <button onClick={() => lastNDays(7)} disabled={loading}>
          Last 7 Days
        </button>
        <button onClick={() => lastNDays(30)} disabled={loading}>
          Last 30 Days
        </button>
      </div>

      <div style={{ marginTop: 12 }}>
        <input
          placeholder="From RunID (YYYYMMDD_HHMMSS)"
          value={fromRunId}
          onChange={e => setFromRunId(e.target.value)}
        />
        <input
          placeholder="To RunID"
          value={toRunId}
          onChange={e => setToRunId(e.target.value)}
          style={{ marginLeft: 8 }}
        />
        <button
          onClick={handleCustomRange}
          disabled={loading || !fromRunId || !toRunId}
          style={{ marginLeft: 8 }}
        >
          Import Range
        </button>
      </div>

      {loading && <LoadingBar text="Fetching Mongo data…" />}
    </div>
  );
}