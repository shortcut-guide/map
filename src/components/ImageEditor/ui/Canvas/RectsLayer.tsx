import React, { useMemo, useEffect } from "react";
import { registerEditorGradient, injectEditorDefsToRoot } from "../../utils/editorGrad";
import type { RectDef } from "../../utils/../types"; // adjust path if needed

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

// ---- simple linear-gradient parser / helper for editor SVG ----
let __localGradCounter = 0;
function genLocalGradId() {
  __localGradCounter += 1;
  return `rl_grad_${__localGradCounter}`;
}
function parseLinearGradientString(input: string) {
  const inner = input.replace(/^\s*linear-gradient\s*\(\s*/i, "").replace(/\)\s*$/, "");
  const parts = inner.split(/\s*,\s*/);
  let anglePart = "90deg";
  if (/^\d+deg$/.test(parts[0]) || /^to\s+/i.test(parts[0])) {
    anglePart = parts.shift()!;
  }
  const stops = parts.map((s) => s.trim());
  return { anglePart, stops };
}
function angleToXY(anglePart: string) {
  const degMatch = anglePart.match(/(-?\d+(?:\.\d+)?)deg/);
  let deg = 90;
  if (degMatch) deg = Number(degMatch[1]);
  // convert css-angle (0deg = up) to vector for objectBoundingBox coords
  // produce percentages for x1,y1,x2,y2
  const rad = (deg - 90) * (Math.PI / 180);
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  const x1 = (0.5 - dx / 2) * 100;
  const y1 = (0.5 - dy / 2) * 100;
  const x2 = (0.5 + dx / 2) * 100;
  const y2 = (0.5 + dy / 2) * 100;
  return { x1: `${x1}%`, y1: `${y1}%`, x2: `${x2}%`, y2: `${y2}%` };
}
// -----------------------------------------------------------------

export default function RectsLayer({
  rects,
  selectedRectIds,
  origToDisplayRect,
  onRectClick,
  onRectPointerDown,
}: {
  rects: RectDef[];
  selectedRectIds: Set<number>;
  origToDisplayRect: (r: RectLike) => RectLike;
  onRectClick: (rectId: number) => void;
  onRectPointerDown: (e: React.PointerEvent, rectId: number) => void;
}) {
  // collect gradient ids by registering them into editorGrad map
  const gradDefs = useMemo(() => {
    const map = new Map<string, { id: string }>();
    for (const r of rects) {
      for (const b of r.blocks ?? []) {
        const bg = (b as any).bgColor;
        if (typeof bg === "string" && /^linear-gradient/i.test(bg)) {
          const reg = registerEditorGradient(bg);
          map.set(bg, { id: reg.id });
        }
      }
    }
    return map;
  }, [rects]);

  // ensure defs are injected into root <svg> once gradients are registered
  useEffect(() => {
    if (gradDefs.size > 0) injectEditorDefsToRoot();
  }, [gradDefs]);

  // render: only emit group here; defs are injected into root <svg> via useEffect
  return (
    <g>
      {rects.map((r) => {
         const base = getBaseRect(r);
         const dr = origToDisplayRect(base);
         const id = (r as any).id as number;
         const isSelected = selectedRectIds.has(id);
 
         // render blocks inside rect
         const blocksElems = (r.blocks ?? []).map((b: any, bi: number) => {
           const bx = dr.x + b.x * dr.width;
           const by = dr.y + b.y * dr.height;
           const bw = b.width * dr.width;
           const bh = b.height * dr.height;
 
           // fallback: block strokeColor -> parent rect strokeColor -> block.stroke -> transparent
           const rectStrokeColor = (r as any).strokeColor ?? (r as any).stroke;
           const stroke = b.strokeColor ?? rectStrokeColor ?? b.stroke ?? "transparent";
           const strokeWidth = (b.strokeWidth ?? 0);
 
           // resolve fill: if CSS linear-gradient, use registered id -> url(#id)
           let fill: string | undefined = "none";
           if (typeof b.bgColor === "string") {
             if (/^linear-gradient/i.test(b.bgColor)) {
               const entry = gradDefs.get(b.bgColor);
               fill = entry ? `url(#${entry.id})` : "transparent";
             } else {
               fill = b.bgColor === "transparent" ? "none" : b.bgColor;
             }
           }
 
           return (
             <rect
               key={`${id}_${b.id ?? bi}`}
               x={bx}
               y={by}
               width={bw}
               height={bh}
               fill={fill}
               stroke={stroke !== "transparent" ? stroke : undefined}
               strokeWidth={strokeWidth > 0 ? strokeWidth : undefined}
               onClick={() => onRectClick(id)}
               onPointerDown={(e) => onRectPointerDown(e as any, id)}
               style={{ pointerEvents: "all", cursor: "pointer" }} // ← ここを確実に入れる
             />
           );
         });
 
        // Render outer rect stroke (rect-level strokeColor/strokeWidth) so Toolbar rect stroke is visible in editor
        const rStrokeColor = (r as any).strokeColor ?? (r as any).stroke;
        const rStrokeWidth = Number((r as any).strokeWidth ?? 0);
        const outerStrokeElem =
          rStrokeWidth > 0 ? (
            <rect
              key={`outline_${id}`}
              x={dr.x}
              y={dr.y}
              width={dr.width}
              height={dr.height}
              fill="none"
              stroke={rStrokeColor}
              strokeWidth={rStrokeWidth * (dr.width / Math.max(1, base.width))}
              style={{ pointerEvents: "none" }}
            />
          ) : null;
 
         return [...blocksElems, outerStrokeElem];
       })}
    </g>
  );
}
