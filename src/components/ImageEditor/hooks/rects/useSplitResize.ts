// src/components/ImageEditor/hooks/rects/useSplitResize.ts
import { useEffect, useRef } from "react";
import type { BlockDef, RectDef } from "../../types";
import { origToDisplayRect } from "../../utils/coords";

const MIN_BLOCK_FRAC = 0.05;

export function useSplitResize(
  rects: RectDef[],
  setRects: (u: (prev: RectDef[]) => RectDef[]) => void,
  getZoom: () => number,
  getOrigSize: () => { width: number; height: number } | null,
  getDisplaySize: () => { width: number; height: number } | null
) {
  const sepRef = useRef<{
    pointerId: number;
    rectId: number;
    mode: "vertical" | "horizontal";
    index: number;
    startMouse: { x: number; y: number };
    startBlocks: BlockDef[];
  } | null>(null);

  function beginSeparatorDrag(
    e: React.PointerEvent,
    rectId: number,
    mode: "vertical" | "horizontal",
    index: number
  ) {
    const r = rects.find((x) => x.id === rectId);
    if (!r || !r.blocks || r.blocks.length < 2) return;
    const pid = e.pointerId ?? -1;
    (e.target as Element).setPointerCapture?.(pid);
    sepRef.current = {
      pointerId: pid,
      rectId,
      mode,
      index,
      startMouse: { x: e.clientX, y: e.clientY },
      startBlocks: JSON.parse(JSON.stringify(r.blocks)),
    };
  }

  useEffect(() => {
    function onMove(e: PointerEvent) {
      const os = getOrigSize();
      const ds = getDisplaySize();
      const sep = sepRef.current;
      if (!sep || sep.pointerId !== e.pointerId || !os || !ds) return;

      const rect = rects.find((r) => r.id === sep.rectId);
      if (!rect) return;

      const dr = origToDisplayRect(rect.rect, os, ds);

      if (sep.mode === "vertical") {
        const dx = (e.clientX - sep.startMouse.x) / getZoom();
        const deltaFrac = dr.width > 0 ? dx / dr.width : 0;

        setRects((prev) =>
          prev.map((r) => {
            if (r.id !== sep.rectId) return r;
            const sorted = [...sep.startBlocks].sort((a, b) => a.x - b.x);
            const i = sep.index;
            if (i < 0 || i >= sorted.length - 1) return r;

            const left = sorted[i];
            const right = sorted[i + 1];

            const leftMin = left.x + MIN_BLOCK_FRAC;
            const rightMax = right.x + right.width - MIN_BLOCK_FRAC;

            let tNew = left.x + left.width + deltaFrac;
            tNew = Math.max(leftMin, Math.min(rightMax, tNew));

            left.width = +(tNew - left.x).toFixed(6);
            right.width = +(right.x + right.width - tNew).toFixed(6);
            right.x = +tNew.toFixed(6);

            const updated = r.blocks.map((b) => {
              const s = sorted.find((sb) => sb.id === b.id)!;
              return { ...b, x: s.x, y: s.y, width: s.width, height: s.height };
            });
            return { ...r, blocks: updated };
          })
        );
      } else {
        const dy = (e.clientY - sep.startMouse.y) / getZoom();
        const deltaFrac = dr.height > 0 ? dy / dr.height : 0;

        setRects((prev) =>
          prev.map((r) => {
            if (r.id !== sep.rectId) return r;
            const sorted = [...sep.startBlocks].sort((a, b) => a.y - b.y);
            const i = sep.index;
            if (i < 0 || i >= sorted.length - 1) return r;

            const top = sorted[i];
            const bottom = sorted[i + 1];

            const topMin = top.y + MIN_BLOCK_FRAC;
            const bottomMax = bottom.y + bottom.height - MIN_BLOCK_FRAC;

            let tNew = top.y + top.height + deltaFrac;
            tNew = Math.max(topMin, Math.min(bottomMax, tNew));

            top.height = +(tNew - top.y).toFixed(6);
            bottom.height = +(bottom.y + bottom.height - tNew).toFixed(6);
            bottom.y = +tNew.toFixed(6);

            const updated = r.blocks.map((b) => {
              const s = sorted.find((sb) => sb.id === b.id)!;
              return { ...b, x: s.x, y: s.y, width: s.width, height: s.height };
            });
            return { ...r, blocks: updated };
          })
        );
      }
    }

    function onUp(e: PointerEvent) {
      if (sepRef.current && sepRef.current.pointerId === e.pointerId) {
        sepRef.current = null;
      }
    }
    function onCancel(e: PointerEvent) {
      if (sepRef.current && sepRef.current.pointerId === e.pointerId) {
        sepRef.current = null;
      }
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  }, [rects, setRects, getOrigSize, getDisplaySize, getZoom]);

  return { beginSeparatorDrag };
}
