import { useCallback, useMemo } from "react";

export function useRectsAdapters(rectsState: any) {
  const safeEvent = useMemo(
    () =>
      ({
        stopPropagation: () => {},
        preventDefault: () => {},
      } as unknown as React.MouseEvent),
    []
  );

  const onRectClickBridge = useCallback(
    (rectId: number) => {
      rectsState.onRectClick(safeEvent as any, rectId);
    },
    [rectsState, safeEvent]
  );

  const onBlockClickBridge = useCallback(
    (rectId: number, blockId: string) => {
      rectsState.onBlockClick(safeEvent as any, rectId, blockId);
    },
    [rectsState, safeEvent]
  );

  return { onRectClickBridge, onBlockClickBridge };
}
