// src/components/ImageEditor/hooks/rects/useRectResize.ts
import { useEffect, useRef, useState } from "react";
import type { RectDef } from "../../types";
import { displayToOrigRect, origToDisplayRect } from "../../utils/coords";

type Handle = "nw" | "ne" | "sw" | "se";

export function useRectResize(
  rects: RectDef[],
  setRects: (u: (prev: RectDef[]) => RectDef[]) => void,
  getZoom: () => number,
  getOrigSize: () => { width: number; height: number } | null,
  getDisplaySize: () => { width: number; height: number } | null
) {
  const [resizeState, setResizeState] = useState<{
    rectId: number;
    handle: Handle;
    startMouse: { x: number; y: number };
    startRectDisp: { x: number; y: number; width: number; height: number };
  } | null>(null);

  function beginResize(e: React.PointerEvent, rectId: number, handle: Handle) {
    const ds = getDisplaySize();
    const os = getOrigSize();
    const rect = rects.find((r) => r.id === rectId);
    if (!rect || !ds || !os) return;
    const dr = origToDisplayRect(rect.rect, os, ds);
    setResizeState({ rectId, handle, startMouse: { x: e.clientX, y: e.clientY }, startRectDisp: dr });
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }

  useEffect(() => {
    function onMove(e: PointerEvent) {
      const os = getOrigSize();
      const ds = getDisplaySize();
      const zoom = getZoom();
      if (!resizeState || !os || !ds) return;

      const { rectId, handle, startMouse, startRectDisp } = resizeState;
      const dx = (e.clientX - startMouse.x) / zoom;
      const dy = (e.clientY - startMouse.y) / zoom;

      let nx = startRectDisp.x;
      let ny = startRectDisp.y;
      let nW = startRectDisp.width;
      let nH = startRectDisp.height;

      if (handle === "nw") {
        nx = startRectDisp.x + dx;
        ny = startRectDisp.y + dy;
        nW = startRectDisp.width - dx;
        nH = startRectDisp.height - dy;
      } else if (handle === "ne") {
        ny = startRectDisp.y + dy;
        nW = startRectDisp.width + dx;
        nH = startRectDisp.height - dy;
      } else if (handle === "sw") {
        nx = startRectDisp.x + dx;
        nW = startRectDisp.width - dx;
        nH = startRectDisp.height + dy;
      } else if (handle === "se") {
        nW = startRectDisp.width + dx;
        nH = startRectDisp.height + dy;
      }

      nW = Math.max(8, nW);
      nH = Math.max(8, nH);

      const dispRect = { x: nx, y: ny, width: nW, height: nH };
      const origRect = displayToOrigRect(dispRect, os, ds);

      setRects((prev) => prev.map((r) => (r.id === rectId ? { ...r, rect: origRect } : r)));
    }
    function onUp() {
      setResizeState(null);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [resizeState, getOrigSize, getDisplaySize, getZoom, setRects]);

  return { beginResize };
}
