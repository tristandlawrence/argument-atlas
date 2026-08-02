export function StrengthBar({
  relation,
  weight,
  opacity,
  width = 26,
}: {
  relation: "SUPPORTS" | "CONTRADICTS";
  weight: number;
  opacity: number;
  width?: number;
}) {
  return (
    <span style={{ display: "flex", alignItems: "center", height: 11, width, flexShrink: 0 }}>
      <span
        style={{
          width: "100%",
          height: weight,
          opacity,
          background: relation === "SUPPORTS" ? "var(--supports)" : "var(--contradicts)",
        }}
      />
    </span>
  );
}
