// src/components/ImageEditor/ui/SplitOverlay.tsx
import React from "react";
import type { RectDef, BlockDef } from "../types";

type Props = {
  rect: RectDef;
  displayRect: { x: number; y: number; width: number; height: number }; // display座標
  dividerColor: string;
  dividerWidth: number;
  onSeparatorDown: (
    e: React.PointerEvent,
    rectId: number,
    mode: "vertical" | "horizontal",
    index: number
  ) => void;
};

type Boundary = { t: number; index: number };

export default function SplitOverlay({
  rect,
  displayRect,
  dividerColor,
  dividerWidth,
  onSeparatorDown,
}: Props) {
  if (!rect.blocks || rect.blocks.length < 2) return null;

  const vBounds = getBoundaries(rect.blocks, "x", "width");
  const hBounds = getBoundaries(rect.blocks, "y", "height");

  return (
    <g transform={`translate(${displayRect.x}, ${displayRect.y})`}>
      {vBounds.map((b, i) => {
        const X = b.t * displayRect.width;
        const hitW = Math.max(12, dividerWidth * 3);
        return (
          <g key={`v-${i}`}>
            <line
              x1={X}
              y1={0}
              x2={X}
              y2={displayRect.height}
              stroke={dividerColor}
              strokeWidth={dividerWidth}
            />
            <rect
              x={X - hitW / 2}
              y={0}
              width={hitW}
              height={displayRect.height}
              fill="transparent"
              style={{ cursor: "col-resize" }}
              onPointerDown={(e) => onSeparatorDown(e, rect.id, "vertical", b.index)}
            />
          </g>
        );
      })}
      {hBounds.map((b, i) => {
        const Y = b.t * displayRect.height;
        const hitH = Math.max(12, dividerWidth * 3);
        return (
          <g key={`h-${i}`}>
            <line
              x1={0}
              y1={Y}
              x2={displayRect.width}
              y2={Y}
              stroke={dividerColor}
              strokeWidth={dividerWidth}
            />
            <rect
              x={0}
              y={Y - hitH / 2}
              width={displayRect.width}
              height={hitH}
              fill="transparent"
              style={{ cursor: "row-resize" }}
              onPointerDown={(e) => onSeparatorDown(e, rect.id, "horizontal", b.index)}
            />
          </g>
        );
      })}
    </g>
  );
}

function getBoundaries(blocks: BlockDef[], posKey: "x" | "y", sizeKey: "width" | "height"): Boundary[] {
  const sorted = [...blocks].sort((a, b) => a[posKey] - b[posKey]);
  const res: Boundary[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const left = sorted[i];
    const t = +(left[posKey] + left[sizeKey]).toFixed(6);
    if (t > 1e-6 && t < 1 - 1e-6) res.push({ t, index: i });
  }
  return res;
}
