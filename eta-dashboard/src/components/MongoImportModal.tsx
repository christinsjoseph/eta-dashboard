import { useState } from "react";
import { dateToRunId } from "../utils/runIdUtils";
import type { EtaRecord } from "../types/eta";

type Props = {
  onImport: (records: EtaRecord[], label: string) => void;
  onClose: () => void;
};

export default function MongoImportModal({ onImport, onClose }: Props) {
  const [range, setRange] = useState<"7d" | "30d" | "custom">("7d");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function importMongo() {
    setLoading(true);
    setError("");

    try {
      let fromRunId: string | undefined;
      let toRunId: string | undefined;

      const now = new Date();

      if (range === "7d") {
        const d = new Date();
        d.setDate(now.getDate() - 7);
        fromRunId = dateToRunId(d);
        toRunId = dateToRunId(now, true);
      }

      if (range === "30d") {
        const d = new Date();
        d.setDate(now.getDate() - 30);
        fromRunId = dateToRunId(d);
        toRunId = dateToRunId(now, true);
      }

      if (range === "custom") {
        if (!from || !to) throw new Error("Select both dates");
        fromRunId = dateToRunId(new Date(from));
        toRunId = dateToRunId(new Date(to), true);
      }

      const res = await fetch("http://localhost:4000/api/eta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromRunId, toRunId }),
      });

      if (!res.ok) throw new Error("Failed to fetch Mongo data");

      const data = await res.json();

      onImport(
        data,
        `Mongo (${range === "custom" ? `${from} → ${to}` : range})`
      );
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false); // 🔑 prevents stuck loading
    }
  }

  return (
    <div style={overlay}>
      <div style={modal}>
        <h2>Import from MongoDB</h2>

        <select value={range} onChange={e => setRange(e.target.value as any)}>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="custom">Custom range</option>
        </select>

        {range === "custom" && (
          <div style={{ display: "flex", gap: 8 }}>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
            <input type="date" value={to} onChange={e => setTo(e.target.value)} />
          </div>
        )}

        {error && <p style={{ color: "red" }}>{error}</p>}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose}>Cancel</button>
          <button onClick={importMongo} disabled={loading}>
            {loading ? "Importing…" : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modal: React.CSSProperties = {
  background: "white",
  padding: 24,
  borderRadius: 16,
  width: 420,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};
