import React, { useEffect } from "react";
import { registerEditorGradient, injectEditorDefsToRoot } from "../../utils/editorGrad";
import type { RectDef, ActiveBlock } from "../../types";
import SvgFittedText from "../SvgFittedText";

type RectLike = { x: number; y: number; width: number; height: number };

function getBaseRect(r: RectDef): RectLike {
  const anyR = r as any;
  if (anyR.rect && typeof anyR.rect === "object") {
    const br = anyR.rect;
    return {
      x: Number(br.x ?? 0),
      y: Number(br.y ?? 0),
      width: Number(br.width ?? 0),
      height: Number(br.height ?? 0),
    };
  }
  return {
    x: Number(anyR.x ?? 0),
    y: Number(anyR.y ?? 0),
    width: Number(anyR.width ?? 0),
    height: Number(anyR.height ?? 0),
  };
}

export default function BlocksLayer({
  rects,
  activeBlock,
  fontFamily,
  origToDisplayRect,
  onBlockClick,
  onRectPointerDown,
}: {
  rects: RectDef[];
  activeBlock: ActiveBlock | null;
  fontFamily: string;
  origToDisplayRect: (r: RectLike) => RectLike;
  onBlockClick: (e: React.MouseEvent, rectId: number, blockId: string) => void;
  onRectPointerDown?: (e: React.PointerEvent, rectId: number) => void;
}) {
  useEffect(() => {
    injectEditorDefsToRoot();
  }, []);

  return (
    <g>
      {rects.flatMap((r) =>
        (r.blocks ?? []).map((b) => {
          const base = getBaseRect(r);
          const dr = origToDisplayRect(base);
          const bx = dr.x + b.x * dr.width;
          const by = dr.y + b.y * dr.height;
          const bw = b.width * dr.width;
          const bh = b.height * dr.height;
          const rid = (r as any).id as number;
          const sel = !!b.selected || (activeBlock && activeBlock.rectId === rid && activeBlock.blockId === b.id);

          return (
            <g
              key={`${rid}:${b.id}`}
              id={`block-${rid}-${b.id}`}
              data-rect-id={rid}
              data-block-id={b.id}
              transform={`translate(${bx}, ${by})`}
              onClick={(e) => {
                // forward original event so upstream handler can stopPropagation and use event info
                onBlockClick(e as any, rid, String(b.id));
              }}
              onPointerDown={(e) => {
                // allow parent rect drag to begin when user presses on a block (will call beginDrag)
                onRectPointerDown?.(e as any, rid);
              }}
              role="group"
              tabIndex={-1}
            >
              <rect
                x={0}
                y={0}
                width={bw}
                height={bh}
                fill={b.bgColor || "transparent"}
                stroke={sel ? "#3b82f6" : "transparent"}
                strokeWidth={sel ? 2 : 0}
                strokeDasharray={sel ? "6 3" : undefined}
              />

              {b.imageUrl && (
                <image
                  href={b.imageUrl}
                  x={0}
                  y={0}
                  width={bw}
                  height={bh}
                  preserveAspectRatio={
                    b.objectFit === "contain"
                      ? "xMidYMid meet"
                      : b.objectFit === "fill" || b.objectFit === "none"
                      ? "none"
                      : "xMidYMid slice"
                  }
                  style={{ pointerEvents: "none" } as any}
                />
              )}

              {b.iconImageUrl && (
                <image
                  href={b.iconImageUrl}
                  x={b.iconOffset?.x ?? 8}
                  y={b.iconOffset?.y ?? 8}
                  width={Math.min(32, bh / 3)}
                  height={Math.min(32, bh / 3)}
                  preserveAspectRatio="xMidYMid meet"
                  style={{ pointerEvents: "none" } as any}
                />
              )}
              {!b.iconImageUrl && b.icon && (
                <text
                  x={b.iconOffset?.x ?? 8}
                  y={b.iconOffset?.y ?? 24}
                  fontSize={Math.min(36, bh / 3)}
                  pointerEvents="none"
                >
                  {b.icon}
                </text>
              )}

              {b.text && (
                <SvgFittedText
                  x={0}
                  y={0}
                  width={bw}
                  height={bh}
                  text={b.text}
                  writingMode={b.writingMode ?? "horizontal-tb"}
                  textOrientation={b.textOrientation ?? "mixed"}
                  fontFamily={b.fontFamily || fontFamily}
                  fontWeight={b.fontWeight}
                  padding={b.textPadding ?? { top: 1, right: 1, bottom: 1, left: 1 }}
                  lineHeight={1.2}
                  baseFontSize={14}
                  align={b.textAlign === "center" ? "center" : b.textAlign === "right" ? "end" : "start"}
                  valign={b.verticalAlign === "center" ? "center" : b.verticalAlign === "bottom" ? "end" : "start"}
                  clip={true}
                  vrlInitialXEm={0.6}
                  vrlInitialYEm={0.8}
                  vrlDxEm={1.2}
                />
              )}
            </g>
          );
        })
      )}
    </g>
  );
}
