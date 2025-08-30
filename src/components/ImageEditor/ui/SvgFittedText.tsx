// src/components/ImageEditor/ui/SvgFittedText.tsx
import React, { useEffect, useId, useMemo, useState } from "react";

type Inset = { top: number; right: number; bottom: number; left: number };
type Align = "start" | "center" | "end";
type WritingMode = "horizontal-tb" | "vertical-rl";
type TextOrientation = "mixed" | "upright";

type Props = {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  writingMode?: WritingMode;
  textOrientation?: TextOrientation;
  fontFamily: string;
  fontWeight?: number | "normal" | "bold";
  padding?: number | Inset;
  lineHeight?: number;      // 横書きの行送り em
  baseFontSize?: number;    // 表示基準フォント(px)
  align?: Align;            // 左中右 / start,center,end
  valign?: Align;           // 上中下 / start,center,end
  clip?: boolean;

  // 縦書きの初期位置/列送り（em）
  vrlInitialXEm?: number;   // 既定 0.6
  vrlInitialYEm?: number;   // 既定 0.8
  vrlDxEm?: number;         // 既定 1.2（右→左に送る）
};

function padToInset(p?: number | Inset): Inset {
  if (p == null) return { top: 1, right: 1, bottom: 1, left: 1 };
  if (typeof p === "number") return { top: p, right: p, bottom: p, left: p };
  return p;
}

/** オフドキュメント実測（HTML, writing-mode 対応） */
const MEASURE_FS = 100; // 実測用フォント(px) — 後で scale
let _host: HTMLDivElement | null = null;
function host(): HTMLDivElement | null {
  if (typeof document === "undefined") return null;
  if (_host) return _host;
  const el = document.createElement("div");
  Object.assign(el.style, {
    position: "fixed",
    left: "-100000px",
    top: "-100000px",
    visibility: "hidden",
    pointerEvents: "none",
  } as Partial<CSSStyleDeclaration>);
  document.body.appendChild(el);
  _host = el;
  return _host;
}

function measureLine(
  text: string,
  fontFamily: string,
  fontWeight: string | number | undefined,
  writingMode: WritingMode,
  textOrientation: TextOrientation,
  lineHeight?: number // 横書き時のみ使用
): { w: number; h: number } {
  const root = host();
  if (!root) return { w: MEASURE_FS, h: MEASURE_FS };

  const div = document.createElement("div");
  Object.assign(div.style, {
    display: "inline-block",
    fontFamily,
    fontWeight: String(fontWeight ?? "normal"),
    fontSize: `${MEASURE_FS}px`,
    lineHeight: lineHeight ? String(lineHeight) : "1",
    whiteSpace: "pre",
    overflowWrap: "normal",
    wordBreak: "normal",
    writingMode,
    textOrientation,
  } as Partial<CSSStyleDeclaration>);
  div.textContent = text || "";
  root.appendChild(div);
  const r = div.getBoundingClientRect();
  root.removeChild(div);
  return { w: Math.max(1, r.width), h: Math.max(1, r.height) };
}

export default function SvgFittedText({
  x,
  y,
  width,
  height,
  text,
  writingMode = "horizontal-tb",
  textOrientation = "mixed",
  fontFamily,
  fontWeight,
  padding,
  lineHeight = 1.2,
  baseFontSize = 16,
  align = "start",
  valign = "start",
  clip = true,
  vrlInitialXEm = 0.6
  ,
  vrlInitialYEm = 0.8,
  vrlDxEm = 1.2,
}: Props) {
  const pad = padToInset(padding);
  const innerW = Math.max(1, width - pad.left - pad.right);
  const innerH = Math.max(1, height - pad.top - pad.bottom);

  const isVertical = writingMode === "vertical-rl";
  const lines = useMemo(() => (text ?? "").split("\n"), [text]);

  // 実測結果（scale 前の内容幅/高さ、内側オフセット、scale）
  const [content, setContent] = useState<{
    contentW0: number;
    contentH0: number;
    innerOffsetX0: number; // 左/上端基準に合わせるための内側オフセット（scale 前 px）
    innerOffsetY0: number;
    scale: number;
  }>({
    contentW0: 1,
    contentH0: 1,
    innerOffsetX0: 0,
    innerOffsetY0: 0,
    scale: 1,
  });

  useEffect(() => {
    if (!text) {
      setContent({ contentW0: 1, contentH0: 1, scale: 1, innerOffsetX0: 0, innerOffsetY0: 0 });
      return;
    }

    const emPx = MEASURE_FS;
    const SHRINK = 0.98;

    if (isVertical) {
      // 各行＝1列として個別に実測（列幅/列高は列ごとに異なる可能性を考慮）
      const colW: number[] = [];
      const colH: number[] = [];
      for (const ln of lines) {
        const { w, h } = measureLine(ln, fontFamily, fontWeight, "vertical-rl", textOrientation);
        colW.push(w);
        colH.push(h);
      }

      // 列の絶対左端 x（px）: 初期 x + 以降 dx（右→左は負方向）
      const dxSignedEm = -Math.abs(vrlDxEm);
      const xsEm = lines.map((_, i) => vrlInitialXEm + i * dxSignedEm);
      const xsPx = xsEm.map((em) => em * emPx);

      // 可視内容の左右端：min(left_i), max(left_i + width_i)
      let minLeft = Infinity;
      let maxRight = -Infinity;
      for (let i = 0; i < lines.length; i++) {
        const left = xsPx[i];
        const right = xsPx[i] + (colW[i] ?? 0);
        if (left < minLeft) minLeft = left;
        if (right > maxRight) maxRight = right;
      }
      if (!isFinite(minLeft)) minLeft = 0;
      if (!isFinite(maxRight)) maxRight = 0;

      // 高さ：初期 y + 最大列高（列数によらず一定）
      const topY = vrlInitialYEm * emPx;
      const maxColH = colH.length ? Math.max(...colH) : 1;

      const contentW0 = Math.max(1, maxRight - minLeft);
      const contentH0 = Math.max(1, topY + maxColH);

      // 左上基準に合わせるための内側オフセット（最小Xと初期Yを打消し）
      const innerOffsetX0 = -minLeft;
      const innerOffsetY0 = -topY;

      const scale = Math.max(0.01, Math.min(innerW / contentW0, innerH / contentH0) * SHRINK);

      setContent({ contentW0, contentH0, innerOffsetX0, innerOffsetY0, scale });
    } else {
      // 横書き：行ごと実測（幅は最大行幅、高さは 1em + (n-1)*lineHeight*em）
      let maxLineW = 1;
      let lineHpx = 1;
      for (const ln of lines) {
        const { w, h } = measureLine(ln, fontFamily, fontWeight, "horizontal-tb", textOrientation, lineHeight);
        if (w > maxLineW) maxLineW = w;
        if (h > lineHpx) lineHpx = h;
      }
      const lineHeightPx = MEASURE_FS * lineHeight;
      const contentW0 = maxLineW;
      const contentH0 =
        (lines.length > 0 ? lineHpx : 0) + Math.max(0, lines.length - 1) * lineHeightPx;

      // 横書きは最初から左上基準に描画する（内側オフセット不要）
      const scale = Math.max(0.01, Math.min(innerW / contentW0, innerH / contentH0) * SHRINK);

      setContent({ contentW0, contentH0, innerOffsetX0: 0, innerOffsetY0: 0, scale });
    }
  }, [
    text,
    lines,
    isVertical,
    fontFamily,
    fontWeight,
    textOrientation,
    lineHeight,
    innerW,
    innerH,
    vrlInitialXEm,
    vrlInitialYEm,
    vrlDxEm,
  ]);

  // 内側左上（表示原点）
  const sx = x + pad.left;
  const sy = y + pad.top;

  // 外側 translate は毎回ゼロから算出（モード切替でも座標を引きずらない）
  const contentW = content.contentW0 * content.scale;
  const contentH = content.contentH0 * content.scale;

  let tx = sx;
  if (align === "center") tx = sx + (innerW - contentW) / 2;
  else if (align === "end") tx = sx + (innerW - contentW);

  let ty = sy;
  if (valign === "center") ty = sy + (innerH - contentH) / 2;
  else if (valign === "end") ty = sy + (innerH - contentH);

  // 内側オフセットも scale と同じ座標系で合成
  const txFinal = tx + content.innerOffsetX0 * content.scale;
  const tyFinal = ty + content.innerOffsetY0 * content.scale;

  const clipId = useId();
  if (!text) return null;

  return (
    <g>
      {clip && (
        <clipPath id={clipId}>
          <rect x={x} y={y} width={width} height={height} />
        </clipPath>
      )}
      <g clipPath={clip ? `url(#${clipId})` : undefined}>
        <g transform={`translate(${txFinal}, ${tyFinal}) scale(${content.scale})`}>
          <text
            xmlSpace="preserve"
            style={{ writingMode, textOrientation }}
            fontFamily={fontFamily}
            fontWeight={fontWeight}
            fontSize={MEASURE_FS}
            dominantBaseline="text-before-edge"
            textAnchor={
              isVertical
                ? "start"
                : align === "start"
                ? "start"
                : align === "center"
                ? "middle"
                : "end"
            }
          >
            {isVertical
              ? (() => {
                  const dxSignedEm = -Math.abs(vrlDxEm);
                  return lines.map((ln, i) => (
                    <tspan
                      key={i}
                      x={`${vrlInitialXEm + i * dxSignedEm}em`}
                      y={`${vrlInitialYEm}em`}
                    >
                      {ln}
                    </tspan>
                  ));
                })()
              : (() => {
                  const lineHeightPx = MEASURE_FS * lineHeight;
                  const anchorX0 =
                    align === "start"
                      ? 0
                      : align === "center"
                      ? content.contentW0 / 2
                      : content.contentW0;
                  return lines.map((ln, i) => (
                    <tspan key={i} x={anchorX0} y={i === 0 ? 0 : i * lineHeightPx}>
                      {ln}
                    </tspan>
                  ));
                })()}
          </text>
        </g>
      </g>
    </g>
  );
}
