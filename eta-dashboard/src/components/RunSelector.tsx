type Props = {
  runs: string[];
  selectedRun: string;
  onChange: (run: string) => void;
};

export default function RunSelector({
  runs,
  selectedRun,
  onChange,
}: Props) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <strong>Run</strong>
      <select
        value={selectedRun}
        onChange={(e) => onChange(e.target.value)}
        style={{ marginLeft: "8px" }}
      >
        <option value="ALL">All Runs</option>
        {runs.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
    </div>
  );
}
