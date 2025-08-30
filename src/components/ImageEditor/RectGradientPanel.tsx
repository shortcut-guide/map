import React from "react";
import { RectDef } from "./types";

export function RectGradientPanel({
  rect,
  onChange,
}: {
  rect: RectDef;
  onChange: (patch: Partial<NonNullable<RectDef["strokeGradient"]>>) => void;
}) {
  const sg = rect.strokeGradient ?? { enabled: false, from: "#ff9a9e", to: "#fad0c4", angleDeg: 0 };
  return (
    <div style={{ display: "grid", gap: 6, gridTemplateColumns: "auto 1fr" }}>
      <label>Enable</label>
      <input type="checkbox" checked={sg.enabled} onChange={(e) => onChange({ enabled: e.target.checked })} />
      <label>From</label>
      <input type="color" value={sg.from} onChange={(e) => onChange({ from: e.target.value })} />
      <label>To</label>
      <input type="color" value={sg.to} onChange={(e) => onChange({ to: e.target.value })} />
      <label>Angle</label>
      <input type="number" min={0} max={359} value={sg.angleDeg} onChange={(e) => onChange({ angleDeg: parseInt(e.target.value || "0", 10) })} />
    </div>
  );
}
