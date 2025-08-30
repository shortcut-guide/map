import React, { useMemo, useCallback } from "react";
import type { RectDef, ActiveBlock } from "../../types";
import { Corner } from "../TrimHandle";
import SvgRoot from "./SvgRoot";
import BackgroundLayer from "./BackgroundLayer";
import RectsLayer from "./RectsLayer";
import BlocksLayer from "./BlocksLayer";
import SeparatorsLayer from "./SeparatorsLayer";
import TrimHandlesLayer from "./TrimHandlesLayer";

type Size = { width: number; height: number };
type Pan = { x: number; y: number };

type Props = {
  imageUrl: string | null;
  displaySize: Size | null;
  zoom: number;
  pan: Pan;
  onPanPointerDown: (e: React.PointerEvent) => void;

  rects: RectDef[];
  selectedRectIds: Set<number>;
  activeBlock: ActiveBlock;

  fontFamily: string;
  origToDisplayRect: (r: { x: number; y: number; width: number; height: number }) => {
    x: number; y: number; width: number; height: number;
  };

  /** ここ重要: イベントは渡さない */
  onRectClick: (rectId: number) => void;
  onRectPointerDown: (e: React.PointerEvent, rectId: number) => void;
  onHandlePointerDown: (e: React.PointerEvent, rectId: number, handle: Corner) => void;

  /** ここ重要: イベントは渡さない */
  onBlockClick: (rectId: number, blockId: string) => void;

  showEditorBackground: boolean;

  dividerColor: string;
  dividerWidth: number;
  onSeparatorDown: (
    e: React.PointerEvent,
    rectId: number,
    mode: "vertical" | "horizontal",
    index: number
  ) => void;
};

export default function Canvas(props: Props) {
  const {
    imageUrl, displaySize, zoom, pan, onPanPointerDown,
    rects, selectedRectIds, activeBlock,
    fontFamily, origToDisplayRect,
    onRectClick, onRectPointerDown, onHandlePointerDown,
    onBlockClick, dividerColor, dividerWidth, onSeparatorDown,
  showEditorBackground,
  } = props;

  const gStyle: React.CSSProperties = useMemo(() => ({
    transformOrigin: "0 0",
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
  }), [pan.x, pan.y, zoom]);

  const stop = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation();
  }, []);

  const width = displaySize?.width ?? 1;
  const height = displaySize?.height ?? 1;

  return (
    <div
      style={{
        flex: 1,
        border: "1px solid #ccc",
        padding: 8,
        position: "relative",
        width: "100%",
        minHeight: 400,
        boxSizing: "border-box",
        overflow: "auto",
        userSelect: "none",
      }}
    >
  <div style={{ position: "relative", width, height, background: "transparent", overflow: "hidden" }}>
        <SvgRoot
          width={width}
          height={height}
          onPanPointerDown={onPanPointerDown}
        >
          <g style={gStyle} onMouseDown={stop} onClick={stop}>
            <BackgroundLayer width={width} height={height} imageUrl={imageUrl} />

            <RectsLayer
              rects={rects}
              selectedRectIds={selectedRectIds}
              origToDisplayRect={origToDisplayRect}
              onRectClick={onRectClick}
              onRectPointerDown={onRectPointerDown}
              showEditorBackground={showEditorBackground}
            />

            <BlocksLayer
              rects={rects}
              activeBlock={activeBlock}
              fontFamily={fontFamily}
              origToDisplayRect={origToDisplayRect}
              onBlockClick={onBlockClick}
            />

            <SeparatorsLayer
              rects={rects}
              origToDisplayRect={origToDisplayRect}
              dividerColor={dividerColor}
              dividerWidth={dividerWidth}
              onSeparatorDown={onSeparatorDown}
            />

            <TrimHandlesLayer
              rects={rects}
              selectedRectIds={selectedRectIds}
              origToDisplayRect={origToDisplayRect}
              onHandlePointerDown={onHandlePointerDown}
            />
          </g>
        </SvgRoot>
      </div>
    </div>
  );
}
