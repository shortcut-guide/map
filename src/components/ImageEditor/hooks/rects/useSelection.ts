// src/components/ImageEditor/hooks/rects/useSelection.ts
import { useCallback, useState } from "react";

export function useSelection() {
  const [selectedRectIds, setSelectedRectIds] = useState<Set<number>>(new Set());

  const selectRect = useCallback((e: React.MouseEvent, rectId: number) => {
    e.stopPropagation();
    setSelectedRectIds((prev) => {
      const next = new Set(prev);
      if (e.shiftKey) {
        next.has(rectId) ? next.delete(rectId) : next.add(rectId);
      } else {
        next.clear();
        next.add(rectId);
      }
      return next;
    });
  }, []);

  const ensureSelected = useCallback((rectId: number, multi: boolean) => {
    setSelectedRectIds((prev) => {
      const next = new Set(prev);
      if (!next.has(rectId)) {
        if (!multi) next.clear();
        next.add(rectId);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedRectIds(new Set()), []);

  return { selectedRectIds, setSelectedRectIds, selectRect, ensureSelected, clearSelection };
}
