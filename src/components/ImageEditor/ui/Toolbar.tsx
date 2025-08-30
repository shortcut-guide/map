import React from "react";

type Props = {
  onPickImage: (file: File) => void;

  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;

  onUndo: () => void;
  onRedo: () => void;

  onAddRect: () => void;
  onDeleteSelected: () => void;
  selectedCount: number;
  showEditorBackground: boolean;
  onToggleEditorBackground: (v: boolean) => void;

  fontFamily: string;
  onChangeFontFamily: (v: string) => void;

  splitDividerColor: string;
  splitDividerWidth: number;
  onChangeSplitDivider: (color: string, width: number) => void;

  rectStrokeWidth: number;
  onChangeRectStrokeWidth: (w: number) => void;

  rectStrokeColor: string;
  onChangeRectStrokeColor: (c: string) => void;

  onSaveLocal: () => void;
  onLoadLocal: () => void;
  onExportJSON: () => void;
  onImportJSON: (file: File | null) => void;

  onExportSVG: () => void;
};

export default function Toolbar(props: Props) {
  const {
    onPickImage,
    zoom,
    onZoomIn,
    onZoomOut,
    onZoomReset,
    onUndo,
    onRedo,
    onAddRect,
    onDeleteSelected,
    selectedCount,
  showEditorBackground,
  onToggleEditorBackground,
    fontFamily,
    onChangeFontFamily,
    splitDividerColor,
    splitDividerWidth,
    onChangeSplitDivider,
    rectStrokeWidth,
    onChangeRectStrokeWidth,
    rectStrokeColor,
    onChangeRectStrokeColor,
    onSaveLocal,
    onLoadLocal,
    onExportJSON,
    onImportJSON,
    onExportSVG,
  } = props;

  return (
    <div style={{ width: 360, display: "grid", gap: 8 }}>
      <div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onPickImage(e.target.files?.[0] as File)}
        />
      </div>

      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <button onClick={onZoomIn}>＋</button>
        <button onClick={onZoomOut}>－</button>
        <button onClick={onZoomReset}>Reset</button>
        <span style={{ marginLeft: 8 }}>Zoom: {Math.round(zoom * 100)}%</span>
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={onUndo}>Undo</button>
        <button onClick={onRedo}>Redo</button>
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={onAddRect}>Add Rect</button>
        <button onClick={onDeleteSelected} disabled={selectedCount === 0}>
          Delete Selected
        </button>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 6, marginLeft: 8 }}>
          <input
            type="checkbox"
            checked={showEditorBackground}
            onChange={(e) => {
              try { console.log('Toolbar toggle EditorBG ->', e.target.checked); } catch (err) {}
              onToggleEditorBackground(e.target.checked);
            }}
          />
          <span style={{ fontSize: 12 }}>Editor BG</span>
        </label>
      </div>

      <div>
        <label>Font Family</label>
        <input
          type="text"
          value={fontFamily}
          onChange={(e) => onChangeFontFamily(e.target.value)}
          style={{ width: "100%" }}
          placeholder="'Meiryo', 'Noto Sans JP', sans-serif"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <div>
          <label>Split Line Color</label>
          <input
            type="color"
            value={splitDividerColor}
            onChange={(e) => onChangeSplitDivider(e.target.value, splitDividerWidth)}
            style={{ width: "100%" }}
          />
        </div>
        <div>
          <label>Split Line Width</label>
          <input
            type="number"
            min={0}
            step={0.5}
            value={splitDividerWidth}
            onChange={(e) => onChangeSplitDivider(splitDividerColor, parseFloat(e.target.value || "0"))}
            style={{ width: "100%" }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <div>
          <label>Rect Stroke Color</label>
          <input
            type="color"
            value={rectStrokeColor}
            onChange={(e) => onChangeRectStrokeColor(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>
        <div>
          <label>Rect Stroke Width (mm)</label>
          <input
            type="number"
            min={0}
            step={0.25}
            value={rectStrokeWidth}
            onChange={(e) => onChangeRectStrokeWidth(parseFloat(e.target.value || "0"))}
            style={{ width: "100%" }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
        <button onClick={onSaveLocal}>Save (Local)</button>
        <button onClick={onLoadLocal}>Load (Local)</button>
        <button onClick={onExportJSON}>Export JSON</button>
        <button onClick={onExportSVG}>Export SVG</button>
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #ccc",
            borderRadius: 4,
            cursor: "pointer",
            userSelect: "none",
            padding: "6px 10px",
          }}
        >
          Import JSON
          <input
            type="file"
            accept="application/json"
            onChange={(e) => onImportJSON(e.target.files?.[0] ?? null)}
            style={{ display: "none" }}
          />
        </label>
      </div>
    </div>
  );
}
