// src/components/ImageEditor/utils/svgExport.ts
import type { RectDef } from "../types";

type Size = { width: number; height: number };

type ExportOptions = {
  imageUrl: string;
  origSize: Size;
  rects: RectDef[];
  fontFamily: string;
  splitLine?: { color: string; width: number };
  embedImages?: boolean;
  excludeRectNumbers?: boolean;
  fileName?: string;
};

async function toDataURL(url: string): Promise<string> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return url;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onerror = (e) => reject(e);
      fr.onload = () => resolve(fr.result as string);
      fr.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

function esc(s: string = ""): string {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));
}

// px -> mm に変換（Illustrator を考慮して 1px = 25.4/72 mm）
function pxToMm(px: number | string): string {
  const p = Number(px) || 0;
  const mm = p * 25.4 / 72; // ← 96 -> 72 に変更
  return `${mm.toFixed(3)}mm`;
}

function tspanLines(text: string): string[] {
  return text.split("\n");
}

// 追加: canvas を使って実際のテキスト幅を測る（フォールバックあり）
function measureTextWidthPx(text: string, fontSizePx: number, fontFamily: string, fontWeight: string) {
  try {
    const cvs = document.createElement("canvas");
    const ctx = cvs.getContext("2d");
    if (!ctx) return text.length * fontSizePx * 0.6;
    ctx.font = `${fontWeight} ${fontSizePx}px ${fontFamily}`;
    const m = ctx.measureText(text);
    return m.width || text.length * fontSizePx * 0.6;
  } catch {
    return text.length * fontSizePx * 0.6;
  }
}

// 追加: canvas で ascent を計測（フォールバックあり）
function measureTextAscentPx(fontSizePx: number, fontFamily: string, fontWeight: string) {
  try {
    const cvs = document.createElement("canvas");
    const ctx = cvs.getContext("2d");
    if (!ctx) return fontSizePx * 0.8;
    ctx.font = `${fontWeight} ${fontSizePx}px ${fontFamily}`;
    const m = ctx.measureText("Hg"); // 高さを測るのに代表的な文字列を使用
    // actualBoundingBoxAscent があればそれを、なければ経験値を返す
    return (m && (m.actualBoundingBoxAscent ?? 0)) || fontSizePx * 0.8;
  } catch {
    return fontSizePx * 0.8;
  }
}

// computeTextScale を実測ベースに変更（fontFamily, weight を受け取る）
function computeTextScale(
  lines: string[],
  blockPx: { w: number; h: number },
  padding: { top: number; right: number; bottom: number; left: number },
  baseFontSize = 16,
  lineHeight = 1.2,
  fontFamily = "'Meiryo', 'Noto Sans JP', sans-serif",
  fontWeight = "normal"
) {
  const innerW = Math.max(1, blockPx.w - padding.left - padding.right);
  const innerH = Math.max(1, blockPx.h - padding.top - padding.bottom);
  // 実際に baseFontSize で描画したときのテキスト幅を計測
  const longestLine = lines.reduce((a, b) =>
    (measureTextWidthPx(b, baseFontSize, fontFamily, fontWeight) > measureTextWidthPx(a, baseFontSize, fontFamily, fontWeight) ? b : a),
    lines[0] || ""
  );
  const textWAtBase = measureTextWidthPx(longestLine, baseFontSize, fontFamily, fontWeight);
  // 高さは「1行分 = baseFontSize」、2行目以降は lineHeight を掛ける
  const lineCount = Math.max(1, lines.length);
  const textHAtBase = baseFontSize + Math.max(0, lineCount - 1) * (baseFontSize * lineHeight);
  const s = Math.min(innerW / Math.max(1, textWAtBase), innerH / Math.max(1, textHAtBase));
  return { scale: isFinite(s) && s > 0 ? s : 1, innerW, innerH, textWAtBase, textHAtBase };
}

function collectBounds(
  blocks: Array<{ x: number; y: number; width: number; height: number }>,
  posKey: "x" | "y",
  sizeKey: "width" | "height"
) {
  const sorted = [...blocks].sort((a, b) => a[posKey] - b[posKey]);
  const res: number[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const left = sorted[i];
    const t = +(left[posKey] + left[sizeKey]).toFixed(6);
    if (t > 1e-6 && t < 1 - 1e-6) res.push(t);
  }
  return res;
}

// グラデーション defs 管理
const __gradDefs: Record<string, string> = {};
let __gradCounter = 0;

function genGradId(): string {
  __gradCounter += 1;
  return `grad${__gradCounter}`;
}

function parseLinearGradientString(input: string) {
  // input: "linear-gradient(90deg,#22d3ee,#8b5cf6)"
  const inner = input.replace(/^\s*linear-gradient\s*\(\s*/i, "").replace(/\)\s*$/, "");
  // split on commas (simple split; assumes no nested commas)
  const parts = inner.split(/\s*,\s*/);
  let anglePart = "180deg"; // default: top->bottom in CSS, but we'll handle common cases
  // if first part is angle or "to ..."
  if (/^\d+deg$/.test(parts[0]) || /^to\s+/i.test(parts[0])) {
    anglePart = parts.shift()!;
  }
  const stops = parts.map((s) => s.trim());
  return { anglePart, stops };
}

function angleToXY(anglePart: string) {
  // CSS: 0deg = to top, 90deg = to right
  const degMatch = anglePart.match(/(-?\d+(?:\.\d+)?)deg/);
  let deg = 180; // fallback
  if (degMatch) deg = Number(degMatch[1]);
  // convert css-angle to vector: CSS 0deg = up. For vector math we convert so 0deg -> (0,-1).
  // Compute unit vector for given angle, then map to x1/y1,x2/y2 by centering.
  const rad = (deg - 90) * (Math.PI / 180); // rotate so 0deg points right in standard trig, adjust
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  const x1 = (0.5 - dx / 2) * 100;
  const y1 = (0.5 - dy / 2) * 100;
  const x2 = (0.5 + dx / 2) * 100;
  const y2 = (0.5 + dy / 2) * 100;
  return { x1: `${x1}%`, y1: `${y1}%`, x2: `${x2}%`, y2: `${y2}%` };
}

function makeLinearGradientDef(gradStr: string) {
  if (__gradDefs[gradStr]) return __gradDefs[gradStr];

  const id = genGradId();
  const { anglePart, stops } = parseLinearGradientString(gradStr);
  const { x1, y1, x2, y2 } = angleToXY(anglePart);

  // parse stops: "color [offset]" or just "color"
  const parsedStops: { color: string; offset?: string }[] = stops.map((s) => {
    const m = s.match(/^(.+?)\s+(\d+%|\d+(?:\.\d+)?%)$/);
    if (m) return { color: m[1].trim(), offset: m[2].trim() };
    return { color: s.trim() };
  });

  // if no offsets, distribute evenly
  const hasOffsets = parsedStops.some((s) => !!s.offset);
  if (!hasOffsets) {
    const n = parsedStops.length;
    parsedStops.forEach((p, i) => {
      p.offset = `${Math.round((i / (n - 1 || 1)) * 100)}%`;
    });
  } else {
    // ensure each has offset (fallback)
    parsedStops.forEach((p, i) => {
      if (!p.offset) p.offset = `${Math.round((i / (parsedStops.length - 1 || 1)) * 100)}%`;
    });
  }

  const stopsSvg = parsedStops
    .map((s) => `<stop offset="${s.offset}" stop-color="${esc(s.color)}"/>`)
    .join("");

  const def = `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" gradientUnits="objectBoundingBox">${stopsSvg}</linearGradient>`;
  __gradDefs[gradStr] = def;
  return def;
}

export async function downloadSVG(opts: ExportOptions) {
  const {
    imageUrl,
    origSize,
    rects,
    fontFamily,
    splitLine,
    embedImages = true,
    excludeRectNumbers = true,
    fileName = "export.svg",
  } = opts;

  const mainImg = embedImages ? await toDataURL(imageUrl) : imageUrl;

  const chunks: string[] = [];
  // 出力物理サイズを mm にする（viewBox は px ベースのユーザー座標のまま）
  // ルートに font-family を付与し、text 要素に明示的にフォント指定する style を追加
  chunks.push(
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${pxToMm(origSize.width)}" height="${pxToMm(origSize.height)}" viewBox="0 0 ${origSize.width} ${origSize.height}" style="font-family:${opts.fontFamily}">`
  );
  chunks.push(`<style>text{font-family:${opts.fontFamily};}</style>`);

  chunks.push(`<image href="${esc(mainImg)}" xlink:href="${esc(mainImg)}" x="0" y="0" width="${origSize.width}" height="${origSize.height}" />`);

  for (const r of rects) {
    const rx = r.rect.x;
    const ry = r.rect.y;
    const rw = r.rect.width;
    const rh = r.rect.height;

    if (r.blocks && r.blocks.length > 0) {
      for (let i = 0; i < r.blocks.length; i++) {
        const b = r.blocks[i];
        const bx = rx + b.x * rw;
        const by = ry + b.y * rh;
        const bw = b.width * rw;
        const bh = b.height * rh;

        if (b.bgColor && /^#|^rgb|^hsl/i.test(b.bgColor)) {
          // stroke が指定されている場合は出力（幅を mm に変換）
          const strokeColor = (b as any).strokeColor;
          const strokeWidth = (b as any).strokeWidth;
          const strokeAttr = strokeColor ? ` stroke="${esc(strokeColor)}"` : "";
          // 数値をそのまま mm として扱う（例: 2 -> "2mm"）
          const strokeWidthAttr = strokeWidth ? ` stroke-width="${Number(strokeWidth)}mm" vector-effect="non-scaling-stroke"` : "";
          chunks.push(`<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${esc(b.bgColor)}"${strokeAttr}${strokeWidthAttr} />`);
        } else if (b.bgColor && /^linear-gradient/i.test(b.bgColor)) {
          const strokeColor = (b as any).strokeColor;
          const strokeWidth = (b as any).strokeWidth;
          const strokeAttr = strokeColor ? ` stroke="${esc(strokeColor)}"` : "";
          const strokeWidthAttr = strokeWidth ? ` stroke-width="${Number(strokeWidth)}mm" vector-effect="non-scaling-stroke"` : "";
          // グラデーション定義はここで登録するだけ（defs は後でまとめて出力）
          const id = makeLinearGradientDefId(b.bgColor)!;
          chunks.push(`<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="url(#${id})"${strokeAttr}${strokeWidthAttr} />`);
        }

        if (b.imageUrl) {
          const href = embedImages ? await toDataURL(b.imageUrl) : b.imageUrl;
          let par = "xMidYMid slice";
          if (b.objectFit === "contain") par = "xMidYMid meet";
          else if (b.objectFit === "fill" || b.objectFit === "none") par = "none";
          chunks.push(`<image href="${esc(href)}" xlink:href="${esc(href)}" x="${bx}" y="${by}" width="${bw}" height="${bh}" preserveAspectRatio="${par}" />`);
        }

        if (b.iconImageUrl) {
          const ih = Math.min(32, bh / 3);
          const iw = ih;
          const ox = b.iconOffset?.x ?? 8;
          const oy = b.iconOffset?.y ?? 8;
          const href = embedImages ? await toDataURL(b.iconImageUrl) : b.iconImageUrl;
          chunks.push(
            `<image href="${esc(href)}" xlink:href="${esc(href)}" x="${bx + ox}" y="${by + oy}" width="${iw}" height="${ih}" preserveAspectRatio="xMidYMid meet" />`
          );
        } else if (b.icon) {
          const ih = Math.min(36, bh / 3);
          const ox = b.iconOffset?.x ?? 8;
          const oy = b.iconOffset?.y ?? 24;
          chunks.push(
            `<text x="${bx + ox}" y="${by + oy}" font-size="${ih}" font-family="${esc(fontFamily)}">${esc(b.icon)}</text>`
          );
        }

        if (b.text) {
          const pad = b.textPadding ?? { top: 1, right: 1, bottom: 1, left: 1 };
          const lines = tspanLines(b.text);
          const weight = b.fontWeight ?? "normal";
          const { scale, textWAtBase, textHAtBase } = computeTextScale(
            lines,
            { w: bw, h: bh },
            pad,
            16,
            1.2,
            b.fontFamily ?? fontFamily,
            String(weight)
          );

          const align = b.textAlign ?? "left";
          const valign = b.verticalAlign ?? "top";
          const anchor = align === "center" ? "middle" : align === "right" ? "end" : "start";

          const innerW = Math.max(1, bw - pad.left - pad.right);
          const innerH = Math.max(1, bh - pad.top - pad.bottom);

          // 実測から算出したスケールでの幅/高さを使用
          const scaledW = (textWAtBase || 0) * scale;
          const scaledH = (textHAtBase || 0) * scale;

          // anchor に合わせたグループの原点位置決定（text-anchor を使う設計）
          let ox: number;
          if (align === "center") ox = bx + pad.left + innerW / 2;
          else if (align === "right") ox = bx + pad.left + innerW;
          else ox = bx + pad.left;

          // 縦位置は dominant-baseline="text-before-edge"（y がテキスト上端）
          let oy: number;
          if (valign === "center") oy = by + pad.top + (innerH - scaledH) / 2;
          else if (valign === "bottom") oy = by + pad.top + innerH - scaledH;
          else oy = by + pad.top;

          const writingMode = b.writingMode ?? "horizontal-tb";
          const textOrientation = b.textOrientation ?? "mixed";
          const fontSizePx = 16 * scale; // editor の基準 16px にスケールを掛けた最終 px サイズ
          // 各行の y を ascent を基準に与える（dy を使わない）。group の oy = by + pad.top をテキスト上端に一致させるため。
          const lineHeightRatio = 1.2;
          const lineHeightPx = fontSizePx * lineHeightRatio;
          // ascent を base (fontSizePx) で実測（環境により異なるので canvas で計測）
          const ascentPx = measureTextAscentPx(fontSizePx, b.fontFamily ?? fontFamily, String(weight));
           const tspans = lines
            .map((ln, i) => `<tspan x="0" y="${(ascentPx + i * lineHeightPx)}">${esc(ln)}</tspan>`)
             .join("");
          chunks.push(
            `<g transform="translate(${ox}, ${oy})">` +
              `<text xml:space="preserve" style="writing-mode:${writingMode};text-orientation:${textOrientation};" ` +
              `font-family="${esc(b.fontFamily || fontFamily)}" font-weight="${esc(String(weight))}" font-size="${fontSizePx}" ` +
              `dominant-baseline="alphabetic" text-anchor="${anchor}">` +
               tspans +
             `</text>` +
           `</g>`
         );
        }
      }

      if (splitLine && r.blocks && r.blocks.length > 1) {
        const xBoundaries = collectBounds(r.blocks, "x", "width");
        for (const t of xBoundaries) {
          const X = rx + t * rw;
          // stroke-width に px を付与し、非スケーリング属性をつける
          chunks.push(
            `<line x1="${X}" y1="${ry}" x2="${X}" y2="${ry + rh}" stroke="${esc(splitLine.color)}" stroke-width="${Number(splitLine.width)}mm" vector-effect="non-scaling-stroke" stroke-linecap="butt" />`
          );
        }
        const yBoundaries = collectBounds(r.blocks, "y", "height");
        for (const t of yBoundaries) {
          const Y = ry + t * rh;
          chunks.push(
            `<line x1="${rx}" y1="${Y}" x2="${rx + rw}" y2="${Y}" stroke="${esc(splitLine.color)}" stroke-width="${Number(splitLine.width)}mm" vector-effect="non-scaling-stroke" stroke-linecap="butt" />`
          );
        }
      }

      // Rect の枠線を出力する（数値をそのまま mm として扱う）
      {
        const rStrokeWidth = Number((r as any).strokeWidth ?? 1.25);
  const rStrokeColor = (r as any).strokeColor ?? (r as any).color ?? "#222222";
        // 出力する場合は fill を none にして stroke を付与
        const rectStrokeAttr =
          rStrokeWidth > 0 ? ` stroke="${esc(rStrokeColor)}" stroke-width="${rStrokeWidth}mm" vector-effect="non-scaling-stroke"` : "";
        chunks.push(`<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="none"${rectStrokeAttr} />`);
      }
    }
  }

  // defs を svg の冒頭近くにまとめて挿入（image の直後に配置）
  const defsList = Object.values(__gradDefs || {});
  if (defsList.length > 0) {
    // svg, style, image が最初に入っている想定なので index = 3 の位置に挿入
    chunks.splice(3, 0, `<defs>${defsList.join("")}</defs>`);
  }
  chunks.push(`</svg>`);

  const svg = chunks.join("\n");
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

// To simplify usage, change makeLinearGradientDef to return id and register def:
// (Replace previous makeLinearGradientDef with this helper if needed)
function makeLinearGradientDefId(gradStr: string) {
  if (__gradDefs[gradStr]) {
    // extract id from stored def string (we stored def, so parse id)
    const m = __gradDefs[gradStr].match(/id="([^"]+)"/);
    return m ? m[1] : null;
  }
  const id = genGradId();
  const def = (() => {
    const { anglePart, stops } = parseLinearGradientString(gradStr);
    const { x1, y1, x2, y2 } = angleToXY(anglePart);
    const parsedStops = stops.map((s) => {
      const m = s.match(/^(.+?)\s+(\d+%|\d+(?:\.\d+)?%)$/);
      if (m) return { color: m[1].trim(), offset: m[2].trim() };
      return { color: s.trim() };
    });
    const hasOffsets = parsedStops.some((s) => !!s.offset);
    if (!hasOffsets) {
      const n = parsedStops.length;
      parsedStops.forEach((p, i) => {
        p.offset = `${Math.round((i / (n - 1 || 1)) * 100)}%`;
      });
    } else {
      parsedStops.forEach((p, i) => {
        if (!p.offset) p.offset = `${Math.round((i / (parsedStops.length - 1 || 1)) * 100)}%`;
      });
    }
    const stopsSvg = parsedStops
      .map((s) => `<stop offset="${s.offset}" stop-color="${esc(s.color)}"/>`)
      .join("");
    return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" gradientUnits="objectBoundingBox">${stopsSvg}</linearGradient>`;
  })();
  __gradDefs[gradStr] = def;
  return id;
}

// When building defs before closing svg open tag:
  // if any defs exist:
  //   chunks.push("<defs>");
  //   for (const d of Object.values(__gradDefs)) chunks.push(d);
  //   chunks.push("</defs>");

  // And when emitting a rect:
 // if (b.bgColor && /^linear-gradient/i.test(b.bgColor)) {
 //   const id = makeLinearGradientDefId(b.bgColor)!;
 //   chunks.push(`<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="url(#${id})" .../>`);
 // }
