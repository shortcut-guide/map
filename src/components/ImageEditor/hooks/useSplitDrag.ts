import { RefObject, useEffect, useRef } from "react";
import { BlockDef, RectDef, Size } from "../types";

const MIN_BLOCK_FRAC = 0.05;

export function useSplitDrag(
  rects: RectDef[],
  setRects: (updater: (prev: RectDef[]) => RectDef[]) => void,
  displaySize: Size | null,
  origSize: Size | null,
  zoom: number,
  pushHistory: () => void
) {
  const sepDragRef = useRef<{
    rectId: number;
    mode: "vertical" | "horizontal";
    index: number;
    startMouse: { x: number; y: number };
    startBlocks: BlockDef[];
  } | null>(null);

  function onSeparatorDown(e: React.PointerEvent, rectId: number, mode: "vertical" | "horizontal", index: number) {
    e.stopPropagation();
    const r = rects.find((rr) => rr.id === rectId);
    if (!r || !r.blocks || r.blocks.length < 2) return;
    sepDragRef.current = {
      rectId,
      mode,
      index,
      startMouse: { x: e.clientX, y: e.clientY },
      startBlocks: JSON.parse(JSON.stringify(r.blocks)),
    };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }

  useEffect(() => {
    function onSepMove(ev: PointerEvent) {
      const st = sepDragRef.current;
      if (!st) return;
      const rIdx = rects.findIndex((rr) => rr.id === st.rectId);
      if (rIdx < 0) return;
      const r = rects[rIdx];
      if (!displaySize || !origSize || !r.blocks) return;

      const dx = (ev.clientX - st.startMouse.x) / zoom;
      const dy = (ev.clientY - st.startMouse.y) / zoom;

      const inv = origSize.width / displaySize.width;
      const dxOrig = dx * inv;
      const dyOrig = dy * inv;

      const nextBlocks = JSON.parse(JSON.stringify(st.startBlocks)) as BlockDef[];

      if (st.mode === "vertical") {
        const totalW = r.rect.width;
        const deltaFrac = dxOrig / totalW;
        const left = nextBlocks[st.index];
        const right = nextBlocks[st.index + 1];
        if (!left || !right) return;

        let newLeftW = Math.max(MIN_BLOCK_FRAC, left.width + deltaFrac);
        let newRightW = Math.max(MIN_BLOCK_FRAC, right.width - deltaFrac);

        const sumTarget = left.width + right.width;
        const sumNow = newLeftW + newRightW;
        if (Math.abs(sumNow - sumTarget) > 1e-6) {
          const diff = sumNow - sumTarget;
          newRightW -= diff;
          if (newRightW < MIN_BLOCK_FRAC) {
            const overflow = MIN_BLOCK_FRAC - newRightW;
            newRightW = MIN_BLOCK_FRAC;
            newLeftW = Math.max(MIN_BLOCK_FRAC, newLeftW - overflow);
          }
        }

        right.x = left.x + newLeftW;
        left.width = newLeftW;
        right.width = newRightW;
      } else {
        const totalH = r.rect.height;
        const deltaFrac = dyOrig / totalH;
        const top = nextBlocks[st.index];
        const bottom = nextBlocks[st.index + 1];
        if (!top || !bottom) return;

        let newTopH = Math.max(MIN_BLOCK_FRAC, top.height + deltaFrac);
        let newBottomH = Math.max(MIN_BLOCK_FRAC, bottom.height - deltaFrac);

        const sumTarget = top.height + bottom.height;
        const sumNow = newTopH + newBottomH;
        if (Math.abs(sumNow - sumTarget) > 1e-6) {
          const diff = sumNow - sumTarget;
          newBottomH -= diff;
          if (newBottomH < MIN_BLOCK_FRAC) {
            const overflow = MIN_BLOCK_FRAC - newBottomH;
            newBottomH = MIN_BLOCK_FRAC;
            newTopH = Math.max(MIN_BLOCK_FRAC, newTopH - overflow);
          }
        }

        bottom.y = top.y + newTopH;
        top.height = newTopH;
        bottom.height = newBottomH;
      }

      setRects((prev) => prev.map((rr, i) => (i === rIdx ? { ...rr, blocks: nextBlocks } : rr)));
    }
    function onSepUp() {
      if (sepDragRef.current) {
        pushHistory();
      }
      sepDragRef.current = null;
    }
    window.addEventListener("pointermove", onSepMove);
    window.addEventListener("pointerup", onSepUp);
    return () => {
      window.removeEventListener("pointermove", onSepMove);
      window.removeEventListener("pointerup", onSepUp);
    };
  }, [rects, displaySize, origSize, zoom, setRects, pushHistory]);

  return { onSeparatorDown };
}
