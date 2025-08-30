import React from "react";

const TRIM_LEN = 12;
const TRIM_STROKE = 2;
const TRIM_CAPTURE = 16;
const TRIM_OFFSET = 0;

export function TrimMark({
  x,
  y,
  corner,
  onDown,
}: {
  x: number;
  y: number;
  corner: "nw" | "ne" | "sw" | "se";
  onDown?: (e: React.PointerEvent) => void;
}) {
  let hx = x,
    hy = y;
  if (corner === "ne") hx = x - TRIM_OFFSET;
  if (corner === "se") {
    hx = x - TRIM_OFFSET;
    hy = y - TRIM_OFFSET;
  }
  if (corner === "sw") hy = y - TRIM_OFFSET;

  const lines = (() => {
    if (corner === "nw") {
      return [
        <line key="h" x1={hx} y1={hy} x2={hx + TRIM_LEN} y2={hy} stroke="#fff" strokeWidth={TRIM_STROKE} paintOrder="stroke" />,
        <line key="v" x1={hx} y1={hy} x2={hx} y2={hy + TRIM_LEN} stroke="#fff" strokeWidth={TRIM_STROKE} paintOrder="stroke" />,
      ];
    }
    if (corner === "ne") {
      return [
        <line key="h" x1={hx} y1={hy} x2={hx - TRIM_LEN} y2={hy} stroke="#fff" strokeWidth={TRIM_STROKE} paintOrder="stroke" />,
        <line key="v" x1={hx} y1={hy} x2={hx} y2={hy + TRIM_LEN} stroke="#fff" strokeWidth={TRIM_STROKE} paintOrder="stroke" />,
      ];
    }
    if (corner === "sw") {
      return [
        <line key="h" x1={hx} y1={hy} x2={hx + TRIM_LEN} y2={hy} stroke="#fff" strokeWidth={TRIM_STROKE} paintOrder="stroke" />,
        <line key="v" x1={hx} y1={hy} x2={hx} y2={hy - TRIM_LEN} stroke="#fff" strokeWidth={TRIM_STROKE} paintOrder="stroke" />,
      ];
    }
    return [
      <line key="h" x1={hx} y1={hy} x2={hx - TRIM_LEN} y2={hy} stroke="#fff" strokeWidth={TRIM_STROKE} paintOrder="stroke" />,
      <line key="v" x1={hx} y1={hy} x2={hx} y2={hy - TRIM_LEN} stroke="#fff" strokeWidth={TRIM_STROKE} paintOrder="stroke" />,
    ];
  })();

  const capX = hx - TRIM_CAPTURE / 2;
  const capY = hy - TRIM_CAPTURE / 2;

  return (
    <g>
      {lines}
      <rect
        x={capX}
        y={capY}
        width={TRIM_CAPTURE}
        height={TRIM_CAPTURE}
        fill="transparent"
        onPointerDown={onDown}
        style={{ cursor: corner === "nw" || corner === "se" ? "nwse-resize" : "nesw-resize" }}
      />
    </g>
  );
}
