import React from "react";
import type { RectDef } from "../../types";
import TrimHandle, { Corner } from "../TrimHandle";

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

export default function TrimHandlesLayer({
  rects,
  selectedRectIds,
  origToDisplayRect,
  onHandlePointerDown,
}: {
  rects: RectDef[];
  selectedRectIds: Set<number>;
  origToDisplayRect: (r: RectLike) => RectLike;
  onHandlePointerDown: (e: React.PointerEvent, rectId: number, handle: Corner) => void;
}) {
  return (
    <g>
      {rects.map((r) => {
        const id = (r as any).id as number;
        if (!selectedRectIds.has(id)) return null;

        const base = getBaseRect(r);
        const d = origToDisplayRect(base);

        return (
          <g key={`handles:${id}`}>
            <TrimHandle
              x={d.x}
              y={d.y}
              corner="nw"
              onPointerDown={(e) => {
                e.stopPropagation();
                onHandlePointerDown(e as any, id, "nw");
              }}
            />
            <TrimHandle
              x={d.x + d.width}
              y={d.y}
              corner="ne"
              onPointerDown={(e) => {
                e.stopPropagation();
                onHandlePointerDown(e as any, id, "ne");
              }}
            />
            <TrimHandle
              x={d.x}
              y={d.y + d.height}
              corner="sw"
              onPointerDown={(e) => {
                e.stopPropagation();
                onHandlePointerDown(e as any, id, "sw");
              }}
            />
            <TrimHandle
              x={d.x + d.width}
              y={d.y + d.height}
              corner="se"
              onPointerDown={(e) => {
                e.stopPropagation();
                onHandlePointerDown(e as any, id, "se");
              }}
            />
          </g>
        );
      })}
    </g>
  );
}
