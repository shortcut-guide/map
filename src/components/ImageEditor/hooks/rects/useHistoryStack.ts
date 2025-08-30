// src/components/ImageEditor/hooks/rects/useHistoryStack.ts
import { useCallback, useRef } from "react";

export function deepCopy<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

export function useHistoryStack<S>() {
  const historyRef = useRef<S[]>([]);
  const futureRef = useRef<S[]>([]);

  const push = useCallback((state: S) => {
    historyRef.current = [...historyRef.current, deepCopy(state)];
    futureRef.current = [];
  }, []);

  const undo = useCallback((apply: (s: S) => void, current: S) => {
    const h = historyRef.current;
    if (h.length === 0) return;
    futureRef.current = [deepCopy(current), ...futureRef.current];
    const prev = h[h.length - 1];
    apply(prev);
    historyRef.current = h.slice(0, -1);
  }, []);

  const redo = useCallback((apply: (s: S) => void, current: S) => {
    const f = futureRef.current;
    if (f.length === 0) return;
    historyRef.current = [...historyRef.current, deepCopy(current)];
    const next = f[0];
    apply(next);
    futureRef.current = f.slice(1);
  }, []);

  return { push, undo, redo };
}
