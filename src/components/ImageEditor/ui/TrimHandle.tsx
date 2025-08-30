// ui/TrimHandle.tsx （安全版・置き換え）
import React from "react";

export type Corner = "nw" | "ne" | "sw" | "se";

type Props = {
  x: number;
  y: number;
  corner: Corner;
  onPointerDown: (e: React.PointerEvent) => void;
};

export default function TrimHandle({ x, y, corner, onPointerDown }: Props) {
  const len = 14;
  const stroke = "#111";
  const glow = "#3b82f6";
  const w = 2;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      style={{ pointerEvents: "auto", cursor: cornerCursor(corner) }}
      onPointerDown={onPointerDown}
    >
      <g stroke={glow} strokeWidth={w + 2} opacity={0.6}>
        {corner === "nw" && (<><line x1={0} y1={0} x2={len} y2={0} /><line x1={0} y1={0} x2={0} y2={len} /></>)}
        {corner === "ne" && (<><line x1={0} y1={0} x2={-len} y2={0} /><line x1={0} y1={0} x2={0} y2={len} /></>)}
        {corner === "sw" && (<><line x1={0} y1={0} x2={len} y2={0} /><line x1={0} y1={0} x2={0} y2={-len} /></>)}
        {corner === "se" && (<><line x1={0} y1={0} x2={-len} y2={0} /><line x1={0} y1={0} x2={0} y2={-len} /></>)}
      </g>
      <g stroke={stroke} strokeWidth={w} opacity={0.95}>
        {corner === "nw" && (<><line x1={0} y1={0} x2={len} y2={0} /><line x1={0} y1={0} x2={0} y2={len} /></>)}
        {corner === "ne" && (<><line x1={0} y1={0} x2={-len} y2={0} /><line x1={0} y1={0} x2={0} y2={len} /></>)}
        {corner === "sw" && (<><line x1={0} y1={0} x2={len} y2={0} /><line x1={0} y1={0} x2={0} y2={-len} /></>)}
        {corner === "se" && (<><line x1={0} y1={0} x2={-len} y2={0} /><line x1={0} y1={0} x2={0} y2={-len} /></>)}
      </g>
      {/* ヒット領域を太らせる */}
      <rect x={-10} y={-10} width={20} height={20} fill="transparent" style={{ pointerEvents: "visiblePainted" }} />
    </g>
  );
}

function cornerCursor(c: Corner) {
  if (c === "nw" || c === "se") return "nwse-resize";
  return "nesw-resize";
}
