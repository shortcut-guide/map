import { useRef } from "react";
import { RectDef } from "../types";

export function useHistory(rects: RectDef[], setRects: (updater: (prev: RectDef[]) => RectDef[]) => void) {
  const history = useRef<RectDef[][]>([]);
  const future = useRef<RectDef[][]>([]);

  const push = () => {
    history.current.push(JSON.parse(JSON.stringify(rects)));
    future.current = [];
  };

  const undo = () => {
    if (!history.current.length) return;
    const prev = history.current.pop()!;
    future.current.unshift(JSON.parse(JSON.stringify(rects)));
    setRects(() => prev);
  };

  const redo = () => {
    if (!future.current.length) return;
    const next = future.current.shift()!;
    history.current.push(JSON.parse(JSON.stringify(rects)));
    setRects(() => next);
  };

  return { push, undo, redo };
}
