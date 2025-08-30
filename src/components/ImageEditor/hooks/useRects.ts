// src/components/ImageEditor/hooks/useRects.ts
import { useCallback, useState, useRef } from "react";
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
  const idCounterRef = useRef<number>(Date.now());
  const { selectedRectIds, setSelectedRectIds, selectRect, clearSelection } = useSelection();
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
    // compute the next selection immediately so we can pass the up-to-date set to beginDrag
    const next = new Set<number>(selectedRectIds);
    if (!next.has(rectId)) {
      if (!e.shiftKey) next.clear();
      next.add(rectId);
    }

    setSelectedRectIds(next);
    push(rects);
    beginDrag(e, next, rectId);
  }, [push, rects, beginDrag, selectedRectIds, setSelectedRectIds]);

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

    // allocate id now
    idCounterRef.current += 1;
    const newId = idCounterRef.current;

    // append using setter callback so we can offset based on current count (avoid exact overlap)
    setRects((prev) => {
      const offset = prev.length * 14;
      const rect: RectDef = {
        id: newId,
        // editor-only rect: visible only when Editor BG is ON; stored color is working color
        color: "#f7f7f7",
        editorOnly: true,
        rect: { x: 20 + offset, y: 20 + offset, width: w, height: h },
        blocks: [],
        strokeWidth: getters.rectStrokeWidth(),
      };
      return [...prev, rect];
    });

    // auto-select newly created rect so user can immediately drag/resize it
    setSelectedRectIds(new Set([newId]));
  }, [getters, setSelectedRectIds]);

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
