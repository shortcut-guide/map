import { useState } from "react";
import type { EditorState, RectDef, ActiveBlock } from "./types";

export function useEditorStore() {
  const [state, set] = useState<EditorState>({
    imageUrl: null,
    origSize: null,
    rects: [],
    selectedRectIds: new Set(),
    displaySize: null,
    zoom: 1,
    pan: { x: 0, y: 0 },
    activeBlock: null,
    fontFamily: "'Inter', system-ui, -apple-system, Segoe UI, Roboto, 'Noto Sans JP', sans-serif",
    rectStrokeWidth: 2,
    splitLineColor: "#00bfff",
    splitLineWidth: 2,
    splitSelectStrokeWidth: 1.5,
  });

  const setState = (patch: Partial<EditorState>) => set((s) => ({ ...s, ...patch }));

  const setRects = (updater: (prev: RectDef[]) => RectDef[]) =>
    set((s) => ({ ...s, rects: updater(s.rects) }));

  return { state, setState, setRects };
}
