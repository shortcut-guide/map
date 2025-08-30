import { useEffect, useRef } from "react";
import { Vec2 } from "../types";

export function useZoomPan(zoom: number, pan: Vec2, setPan: (p: Vec2) => void) {
  const ref = useRef<{ start: Vec2; orig: Vec2 } | null>(null);

  const onDown = (e: React.PointerEvent) => {
    ref.current = { start: { x: e.clientX, y: e.clientY }, orig: { ...pan } };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const onMove = (e: PointerEvent) => {
    if (!ref.current) return;
    const dx = e.clientX - ref.current.start.x;
    const dy = e.clientY - ref.current.start.y;
    setPan({ x: ref.current.orig.x + dx, y: ref.current.orig.y + dy });
  };

  const onUp = () => (ref.current = null);

  useEffect(() => {
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  return { onDown };
}
