// src/components/ImageEditor/hooks/rects/useRectBlocks.ts
import { useCallback, useState } from "react";
import type { RectDef } from "../../types";

export function useRectBlocks(rects: RectDef[], setRects: (updater: (prev: RectDef[]) => RectDef[]) => void) {
  const [activeBlock, setActiveBlock] = useState<{ rectId: number; blockId: string } | null>(null);

  const onBlockClick = useCallback(
    (e: React.MouseEvent, rectId: number, blockId: string) => {
      e.stopPropagation();
      setActiveBlock({ rectId, blockId });
      setRects((prev) =>
        prev.map((r) =>
          r.id === rectId
            ? { ...r, blocks: r.blocks.map((b) => ({ ...b, selected: b.id === blockId })) }
            : { ...r, blocks: r.blocks?.map((b) => ({ ...b, selected: false })) }
        )
      );
    },
    [setRects]
  );

  return { activeBlock, setActiveBlock, onBlockClick };
}
