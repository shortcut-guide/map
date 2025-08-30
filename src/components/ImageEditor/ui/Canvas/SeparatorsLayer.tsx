import React from "react";
import type { RectDef } from "../../types";
import { getBoundaries } from "./bounds";

type RectLike = { x: number; y: number; width: number; height: number };

function getBaseRect(r: RectDef): RectLike {
  const anyR = r as any;
  if (anyR.rect && typeof anyR.rect === "object") {
    const br = anyR.rect;
    return {
      x: Number(br.x ?? 0),
      y: Number(br.y ?? 0),
      width: Number(br.width ?? 0),
      height: Number(br.height ?? 0),
    };
  }
  return {
    x: Number(anyR.x ?? 0),
    y: Number(anyR.y ?? 0),
    width: Number(anyR.width ?? 0),
    height: Number(anyR.height ?? 0),
  };
}

export default function SeparatorsLayer({
  rects,
  origToDisplayRect,
  dividerColor,
  dividerWidth,
  onSeparatorDown,
}: {
  rects: RectDef[];
  origToDisplayRect: (r: RectLike) => RectLike;
  dividerColor: string;
  dividerWidth: number;
  onSeparatorDown: (
    e: React.PointerEvent,
    rectId: number,
    mode: "vertical" | "horizontal",
    index: number
  ) => void;
}) {
  return (
    <g>
      {rects.map((r) => {
        const id = (r as any).id as number;
        const base = getBaseRect(r);
        const dr = origToDisplayRect(base);
        const vBounds = getBoundaries((r as any).blocks ?? [], "x", "width");
        const hBounds = getBoundaries((r as any).blocks ?? [], "y", "height");

        return (
          <g key={`sep:${id}`}>
            {/* 縦仕切り */}
            {vBounds.map(({ t, index }) => {
              const x = dr.x + dr.width * t;
              const hitW = Math.max(12, dividerWidth * 3);
              return (
                <g key={`v:${index}`}>
                  <line
                    x1={x}
                    y1={dr.y}
                    x2={x}
                    y2={dr.y + dr.height}
                    stroke={dividerColor}
                    strokeWidth={dividerWidth}
                  />
                  <rect
                    x={x - hitW / 2}
                    y={dr.y}
                    width={hitW}
                    height={dr.height}
                    fill="transparent"
                    style={{ cursor: "col-resize" }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onSeparatorDown(e, id, "vertical", index);
                    }}
                  />
                </g>
              );
            })}
            {/* 横仕切り */}
            {hBounds.map(({ t, index }) => {
              const y = dr.y + dr.height * t;
              const hitH = Math.max(12, dividerWidth * 3);
              return (
                <g key={`h:${index}`}>
                  <line
                    x1={dr.x}
                    y1={y}
                    x2={dr.x + dr.width}
                    y2={y}
                    stroke={dividerColor}
                    strokeWidth={dividerWidth}
                  />
                  <rect
                    x={dr.x}
                    y={y - hitH / 2}
                    width={dr.width}
                    height={hitH}
                    fill="transparent"
                    style={{ cursor: "row-resize" }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onSeparatorDown(e, id, "horizontal", index);
                    }}
                  />
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
}
