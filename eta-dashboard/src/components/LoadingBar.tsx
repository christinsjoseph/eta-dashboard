export default function LoadingBar({ text }: { text: string }) {
  return (
    <div
      style={{
        marginTop: 12,
        padding: "10px 14px",
        borderRadius: 8,
        background: "#E0F2FE",
        color: "#0369A1",
        fontWeight: 600,
      }}
    >
      ⏳ {text}
    </div>
  );
}
