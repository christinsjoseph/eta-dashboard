type Source = {
  id: string;
  name: string;
};

type Props = {
  sources: Source[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function SourceSelector({
  sources,
  selectedIds,
  onToggle,
  onDelete,
}: Props) {
  return (
    <div style={{ marginTop: 20 }}>
      <h3>Data Sources</h3>

      {sources.map(s => (
        <div
          key={s.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 6,
          }}
        >
          <input
            type="checkbox"
            checked={selectedIds.includes(s.id)}
            onChange={() => onToggle(s.id)}
          />
          <span style={{ flex: 1 }}>{s.name}</span>
          <button onClick={() => onDelete(s.id)}>🗑</button>
        </div>
      ))}
    </div>
  );
}
