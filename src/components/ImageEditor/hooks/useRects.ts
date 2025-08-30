// src/components/ImageEditor/hooks/useRects.ts
import { useCallback, useState } from "react";
import type { RectDef, BlockDef } from "../types";
import { useHistoryStack } from "./rects/useHistoryStack";
import { useSelection } from "./rects/useSelection";
import { useRectBlocks } from "./rects/useRectBlocks";
import { useRectDrag } from "./rects/useRectDrag";
import { useRectResize } from "./rects/useRectResize";
import { useSplitResize } from "./rects/useSplitResize";

type Getters = {
  editorZoom: () => number;
  displaySizeGetter: () => { width: number; height: number } | null;
  origSizeGetter: () => { width: number; height: number } | null;
  rectStrokeWidth: () => number;
};

export function useRects(getters: Getters) {
  const [rects, setRects] = useState<RectDef[]>([]);
  const { selectedRectIds, setSelectedRectIds, selectRect, ensureSelected, clearSelection } = useSelection();
  const { push, undo, redo } = useHistoryStack<RectDef[]>();

  const { activeBlock, setActiveBlock, onBlockClick } = useRectBlocks(rects, setRects);

  const { beginDrag } = useRectDrag(rects, setRects, getters.editorZoom, getters.origSizeGetter, getters.displaySizeGetter);
  const { beginResize } = useRectResize(rects, setRects, getters.editorZoom, getters.origSizeGetter, getters.displaySizeGetter);
  const { beginSeparatorDrag } = useSplitResize(rects, setRects, getters.editorZoom, getters.origSizeGetter, getters.displaySizeGetter);

  const onRectClick = useCallback((e: React.MouseEvent, rectId: number) => {
    setActiveBlock(null);
    selectRect(e, rectId);
  }, [selectRect, setActiveBlock]);

  const onRectPointerDown = useCallback((e: React.PointerEvent, rectId: number) => {
    ensureSelected(rectId, e.shiftKey);
    push(rects);
    beginDrag(e, selectedRectIds, rectId);
  }, [ensureSelected, push, rects, beginDrag, selectedRectIds]);

  const onHandlePointerDown = useCallback((e: React.PointerEvent, rectId: number, handle: "nw"|"ne"|"sw"|"se") => {
    push(rects);
    beginResize(e, rectId, handle);
  }, [push, rects, beginResize]);

  const onSeparatorDown = useCallback((e: React.PointerEvent, rectId: number, mode: "vertical"|"horizontal", index: number) => {
    push(rects);
    beginSeparatorDrag(e, rectId, mode, index);
  }, [push, rects, beginSeparatorDrag]);

  const addRect = useCallback(() => {
    const os = getters.origSizeGetter();
    if (!os) return;
    const w = Math.max(40, Math.round(os.width / 4));
    const h = Math.max(40, Math.round(os.height / 4));
    const newRect: RectDef = {
      id: Date.now(),
      color: "#ff9900",
      rect: { x: 20, y: 20, width: w, height: h },
      blocks: [],
      strokeWidth: getters.rectStrokeWidth(),
    };
    setRects((p) => [...p, newRect]);
  }, [getters]);

  const deleteSelectedRects = useCallback(() => {
    push(rects);
    setRects((prev) => prev.filter((r) => !selectedRectIds.has(r.id)));
    setSelectedRectIds(new Set());
    setActiveBlock(null);
  }, [push, rects, selectedRectIds, setSelectedRectIds, setActiveBlock]);

  return {
    rects,
    setRects,
    selectedRectIds,
    setSelectedRectIds,
    activeBlock,
    setActiveBlock,
    onRectClick,
    onRectPointerDown,
    onHandlePointerDown,
    onBlockClick,
    onSeparatorDown,
    addRect,
    deleteSelectedRects,
    undo: () => undo(setRects, rects),
    redo: () => redo(setRects, rects),
    clearSelection,
  };
}
