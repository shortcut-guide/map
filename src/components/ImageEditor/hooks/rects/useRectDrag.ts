// src/components/ImageEditor/hooks/rects/useRectDrag.ts
import { useEffect, useRef } from "react";
import type { RectDef } from "../../types";

type DragSnapshot = {
  pointerId: number;
  startMouse: { x: number; y: number };
  startRectsOrig: Record<number, { x: number; y: number; width: number; height: number }>;
};

export function useRectDrag(
  rects: RectDef[],
  setRects: (u: (prev: RectDef[]) => RectDef[]) => void,
  getZoom: () => number,
  getOrigSize: () => { width: number; height: number } | null,
  getDisplaySize: () => { width: number; height: number } | null
) {
  const dragRef = useRef<DragSnapshot | null>(null);

  function beginDrag(e: React.PointerEvent, selectedIds: Set<number>, rectId: number) {
    const os = getOrigSize();
    const ds = getDisplaySize();
    if (!os || !ds) return;

    const startRectsOrig: DragSnapshot["startRectsOrig"] = {};
    for (const r of rects) {
      if (selectedIds.has(r.id) || r.id === rectId) startRectsOrig[r.id] = { ...r.rect };
    }

    const pid = (e as any).pointerId ?? -1;
    dragRef.current = {
      pointerId: pid,
      startMouse: { x: e.clientX, y: e.clientY },
      startRectsOrig,
    };
    (e.target as Element).setPointerCapture?.(pid);
  }

  useEffect(() => {
    function onMove(e: PointerEvent) {
      const snap = dragRef.current;
      if (!snap) return;
      // ポインタ一致チェック（他の指/デバイスを無視）
      if (e.pointerId !== snap.pointerId) return;

      const os = getOrigSize();
      const ds = getDisplaySize();
      if (!os || !ds) return;

      const zoom = getZoom();
      const dxDisp = (e.clientX - snap.startMouse.x) / (zoom || 1);
      const dyDisp = (e.clientY - snap.startMouse.y) / (zoom || 1);
      const inv = os.width / ds.width;
      const dxO = dxDisp * inv;
      const dyO = dyDisp * inv;

      setRects((prev) =>
        prev.map((r) => {
          const s = snap.startRectsOrig[r.id];
          if (!s) return r; // 非選択 rect はそのまま
          return { ...r, rect: { x: s.x + dxO, y: s.y + dyO, width: s.width, height: s.height } };
        })
      );
    }

    function endDrag(e: PointerEvent) {
      const snap = dragRef.current;
      if (snap && e.pointerId === snap.pointerId) {
        dragRef.current = null;
      }
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, [getOrigSize, getDisplaySize, getZoom, setRects]);

  return { beginDrag };
}
