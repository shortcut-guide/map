import React, { useState } from "react";
import type { RectDef, BlockDef, Inset } from "../types";

type ActiveBlock = { rectId: number | string; blockId: string | number } | null;

type Props = {
  rects: RectDef[];
  active: ActiveBlock;
  fontFamily: string;

  onUpdateBlock: (rectId: number, blockId: string, patch: Partial<BlockDef>) => void;
  onBlockImageFile: (rectId: number, blockId: string, file: File | null) => void;
  onBlockIconImageFile: (rectId: number, blockId: string, file: File | null) => void;
  onResetBlockIcon: (rectId: number, blockId: string) => void;

  selectedRectIds?: Set<number>;
  onSplitRect?: (rectId: number, rows: number, cols: number) => void;

  sampleIcons?: string[];
};

export default function BlockInspector({
  rects,
  active,
  fontFamily,
  onUpdateBlock,
  onBlockImageFile,
  onBlockIconImageFile,
  onResetBlockIcon,
  selectedRectIds,
  onSplitRect,
  sampleIcons = ["🔥", "⭐", "🆕", "➡️", "📌"],
}: Props) {
  // Hooks は無条件で先頭に
  const [rows, setRows] = useState<number>(1);
  const [cols, setCols] = useState<number>(1);

  // 分割モード条件（active なし & 単一 rect 選択）
  const isSplitMode = !active && !!selectedRectIds && selectedRectIds.size === 1;
  const selectedRid = isSplitMode ? Array.from(selectedRectIds!)[0] : null;
  const selectedRect = isSplitMode ? rects.find((x: any) => String(x.id) === String(selectedRid)) : null;

  // Block 編集対象
  const rid = active ? String(active.rectId) : null;
  const bid = active ? String(active.blockId) : null;
  const r = active ? rects.find((x: any) => String(x.id) === rid) : null;
  const b = active ? r?.blocks?.find((x: any) => String(x.id) === bid) : null;
  const pad: Inset | null = b ? (b.textPadding ?? { top: 1, right: 1, bottom: 1, left: 1 }) : null;

  return (
    <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Rect Block Splitter（条件描画） */}
      {isSplitMode && selectedRect && (
        <div>
          <strong>Rect Block Splitter</strong>
          <div style={{ marginTop: 8, display: "flex", gap: 12, alignItems: "center" }}>
            <label>
              Rows:&nbsp;
              <input
                type="number"
                min={1}
                max={50}
                value={rows}
                onChange={(e) => setRows(Math.max(1, parseInt(e.target.value || "1", 10)))}
                style={{ width: 80 }}
              />
            </label>
            <label>
              Cols:&nbsp;
              <input
                type="number"
                min={1}
                max={50}
                value={cols}
                onChange={(e) => setCols(Math.max(1, parseInt(e.target.value || "1", 10)))}
                style={{ width: 80 }}
              />
            </label>
            <button
              onClick={() => onSplitRect && onSplitRect(selectedRect.id as any, rows, cols)}
              disabled={!onSplitRect}
            >
              Apply
            </button>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
            * 分割は rect の相対座標（0〜1）で block を生成します。既存 blocks は上書きされます。
          </div>
        </div>
      )}

      {/* Block Inspector（フォントは Toolbar 管理。active がある場合のみ） */}
      {active && r && b && pad && (
        <div>
          <strong>Block Inspector</strong>

          <div style={{ marginTop: 8 }}>
            <label>Text:</label>
            <textarea
              value={b.text ?? ""}
              onChange={(e) => onUpdateBlock(r.id as any, b.id as any, { text: e.target.value })}
              rows={4}
              style={{ width: "100%", fontFamily }}
            />
          </div>

          <div style={{ marginTop: 8, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <label>
              Writing Mode:&nbsp;
              <select
                value={b.writingMode ?? "horizontal-tb"}
                onChange={(e) => onUpdateBlock(r.id as any, b.id as any, { writingMode: e.target.value as any })}
              >
                <option value="horizontal-tb">horizontal-tb</option>
                <option value="vertical-rl">vertical-rl</option>
              </select>
            </label>
            <label>
              Text Orientation:&nbsp;
              <select
                value={b.textOrientation ?? "mixed"}
                onChange={(e) => onUpdateBlock(r.id as any, b.id as any, { textOrientation: e.target.value as any })}
              >
                <option value="mixed">mixed</option>
                <option value="upright">upright</option>
              </select>
            </label>
          </div>

          <div style={{ marginTop: 8, display: "flex", gap: 12, alignItems: "center" }}>
            <label>
              <input
                type="checkbox"
                checked={(b.fontWeight ?? "normal") !== "normal"}
                onChange={(e) => onUpdateBlock(r.id as any, b.id as any, { fontWeight: e.target.checked ? "bold" : "normal" })}
              />{" "}
              Bold
            </label>

            <label>
              Horz Align:&nbsp;
              <select
                value={b.textAlign ?? "left"}
                onChange={(e) => onUpdateBlock(r.id as any, b.id as any, { textAlign: e.target.value as any })}
              >
                <option value="left">left</option>
                <option value="center">center</option>
                <option value="right">right</option>
              </select>
            </label>

            <label>
              Vert Align:&nbsp;
              <select
                value={b.verticalAlign ?? "top"}
                onChange={(e) => onUpdateBlock(r.id as any, b.id as any, { verticalAlign: e.target.value as any })}
              >
                <option value="top">top</option>
                <option value="center">center</option>
                <option value="bottom">bottom</option>
              </select>
            </label>
          </div>

          <div style={{ marginTop: 8 }}>
            <label>Text Padding (px):</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginTop: 6 }}>
              <input
                type="number" value={pad.top} min={0}
                onChange={(e) =>
                  onUpdateBlock(r.id as any, b.id as any, {
                    textPadding: { ...pad, top: parseInt(e.target.value || "0", 10) },
                  })
                }
                placeholder="Top" title="Top"
              />
              <input
                type="number" value={pad.right} min={0}
                onChange={(e) =>
                  onUpdateBlock(r.id as any, b.id as any, {
                    textPadding: { ...pad, right: parseInt(e.target.value || "0", 10) },
                  })
                }
                placeholder="Right" title="Right"
              />
              <input
                type="number" value={pad.bottom} min={0}
                onChange={(e) =>
                  onUpdateBlock(r.id as any, b.id as any, {
                    textPadding: { ...pad, bottom: parseInt(e.target.value || "0", 10) },
                  })
                }
                placeholder="Bottom" title="Bottom"
              />
              <input
                type="number" value={pad.left} min={0}
                onChange={(e) =>
                  onUpdateBlock(r.id as any, b.id as any, {
                    textPadding: { ...pad, left: parseInt(e.target.value || "0", 10) },
                  })
                }
                placeholder="Left" title="Left"
              />
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <label>Background (color or CSS gradient):</label>
            <input
              type="text"
              value={b.bgColor ?? ""}
              onChange={(e) => onUpdateBlock(r.id as any, b.id as any, { bgColor: e.target.value })}
              placeholder="#ffffff or linear-gradient(90deg,#f00,#00f)"
              style={{ width: "100%" }}
            />
          </div>
        </div>
      )}

      {/* どちらにも該当しない場合 */}
      {!isSplitMode && !active && <div>No block selected.</div>}
    </div>
  );
}
