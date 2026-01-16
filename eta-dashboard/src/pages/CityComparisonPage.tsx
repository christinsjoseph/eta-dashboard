import React from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Tooltip, 
  Legend 
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register only what you actually use
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Tooltip, 
  Legend
);

type Props = {
  city: string;
  leftSource: any;   // ← your data source type
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
    (r: any) => r.city?.toLowerCase() === city.toLowerCase()
  );

  const rightRecords = rightSource.records.filter(
    (r: any) => r.city?.toLowerCase() === city.toLowerCase()
  );

  // ── Prepare your data once ───────────────────────────────────────────────
  const years = [...new Set([
    ...leftRecords.map(r => r.year),
    ...rightRecords.map(r => r.year)
  ])].sort();

  const prepareDataset = (records: any[], label: string, color: string) => ({
    label,
    data: years.map(year => {
      const rec = records.find(r => r.year === year);
      return rec ? rec.population ?? rec.value ?? 0 : null; // ← adapt field name!
    }),
    borderColor: color,
    backgroundColor: color + '44', // light transparent fill
    tension: 0.3,
    pointRadius: 3,
  });

  const populationData = {
    labels: years,
    datasets: [
      prepareDataset(leftRecords,  "Left Source",  "#6366f1"),
      prepareDataset(rightRecords, "Right Source", "#a78bfa"),
    ]
  };

  // You can prepare many more stats/charts the same way...
  // population, temperature, crimeRate, avgSalary, etc.

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'top' as const,
        labels: { font: { size: 11 }, color: '#e2e8f0' }
      },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      x: { ticks: { color: '#94a3b8', font: { size: 10 } } },
      y: { ticks: { color: '#94a3b8', font: { size: 10 } } },
    },
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        height: '100vh',
        background: 'linear-gradient(to bottom, #0f172a, #020617)',
        padding: '16px',
        color: '#e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        flexShrink: 0,
      }}>
        <button onClick={onBackToOverview} className="back-btn">← Back</button>
        <h2 style={{ margin: 0, background: 'linear-gradient(90deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {city.toUpperCase()} Comparison
        </h2>
        <button onClick={onExitComparison} className="exit-btn">✕ Exit</button>
      </div>

      {/* Main content - you control the proportions! */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        overflow: 'hidden',
      }}>

        {/* Left column example */}
        <div className="comparison-panel left">
          <h3>Left Source</h3>
          <div className="chart-container">
            <h4>Population Trend</h4>
            <div style={{ height: '180px' }}>
              <Line data={populationData} options={chartOptions} />
            </div>
          </div>

          {/* More compact stats, mini-charts, key-value pairs... */}
          <div className="key-stats">
            <div>Latest Pop: <strong>{leftRecords.at(-1)?.population?.toLocaleString() ?? '-'}</strong></div>
            {/* ... more ... */}
          </div>
        </div>

        {/* Right column - symmetric */}
        <div className="comparison-panel right">
          <h3>Right Source</h3>
          <div className="chart-container">
            <h4>Population Trend</h4>
            <div style={{ height: '180px' }}>
              <Line data={populationData} options={chartOptions} />
            </div>
          </div>

          <div className="key-stats">
            <div>Latest Pop: <strong>{rightRecords.at(-1)?.population?.toLocaleString() ?? '-'}</strong></div>
            {/* ... */}
          </div>
        </div>
      </div>

      <style jsx>{`
        .comparison-panel {
          background: rgba(15, 23, 42, 0.65);
          border-radius: 12px;
          padding: 12px 16px;
          overflow-y: auto;
          border: 1px solid rgba(99, 102, 241, 0.25);
        }
        .left  { border-color: rgba(99, 102, 241, 0.4); }
        .right { border-color: rgba(168, 85, 247, 0.4); }

        h3 { margin: 0 0 12px 0; font-size: 1.1rem; }
        h4 { margin: 0 0 8px 0; font-size: 0.9rem; color: #94a3b8; }

        .chart-container {
          background: rgba(0,0,0,0.2);
          border-radius: 8px;
          padding: 10px;
          margin-bottom: 16px;
        }

        .key-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          font-size: 0.82rem;
        }

        .back-btn, .exit-btn {
          padding: 8px 14px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }
        .back-btn { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; }
        .exit-btn  { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; }
      `}</style>
    </div>
  );
}