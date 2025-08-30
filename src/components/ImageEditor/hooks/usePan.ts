// src/components/ImageEditor/hooks/usePan.ts
import { useCallback, useEffect, useRef } from "react";

type Vec2 = { x: number; y: number };

type UsePanArgs = {
  getZoom: () => number;
  getDisplaySize: () => { width: number; height: number } | null;
  getPan: () => Vec2;
  setPan: (p: Vec2) => void;
};

export function usePan({ getZoom, getDisplaySize, getPan, setPan }: UsePanArgs) {
  const dragRef = useRef<{ start: Vec2; orig: Vec2 } | null>(null);

  const clampPan = useCallback(
    (pan: Vec2, zoom: number): Vec2 => {
      const ds = getDisplaySize();
      if (!ds) return pan;
      const { width: vw, height: vh } = ds;
      const cw = vw * zoom;
      const ch = vh * zoom;
      const minX = Math.min(0, vw - cw);
      const maxX = 0;
      const minY = Math.min(0, vh - ch);
      const maxY = 0;
      return {
        x: Math.max(minX, Math.min(maxX, pan.x)),
        y: Math.max(minY, Math.min(maxY, pan.y)),
      };
    },
    [getDisplaySize]
  );

  const onPanPointerDown = useCallback((e: React.PointerEvent) => {
    dragRef.current = { start: { x: e.clientX, y: e.clientY }, orig: { ...getPan() } };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }, [getPan]);

  useEffect(() => {
    function onMove(ev: PointerEvent) {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.start.x;
      const dy = ev.clientY - dragRef.current.start.y;
      const next = { x: dragRef.current.orig.x + dx, y: dragRef.current.orig.y + dy };
      setPan(clampPan(next, getZoom()));
    }
    function onUp() {
      dragRef.current = null;
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [clampPan, getZoom, setPan]);

  return { onPanPointerDown, clampPan };
}
