import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Toolbar from "./ui/Toolbar";
import Canvas from "./ui/Canvas";
import BlockInspector from "./ui/BlockInspector";
import { downloadSVG } from "./utils/svgExport";
import {
  formatDate,
  loadFromLocal,
  saveToLocal,
  exportToFile,
  importFromFile,
  type PersistedProject,
} from "./utils/persist";
import { usePan } from "./hooks/usePan";
import { useRects } from "./hooks/useRects";
import type { RectDef, BlockDef, ActiveBlock  } from "./types";

const DEFAULT_FONT_FAMILY = "'Meiryo', 'Noto Sans JP', sans-serif";

type Size = { width: number; height: number };
type Pan = { x: number; y: number };
type EditorState = {
  fontFamily: string;
  zoom: number;
  pan: Pan;
  splitDivider: { color: string; width: number };
  rectStrokeWidth: number;
  rectStrokeColor: string;
};

function deepCopy<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}
function samePan(a: Pan, b: Pan) {
  return a.x === b.x && a.y === b.y;
}

export default function ImageEditor() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [origSize, setOrigSize] = useState<Size | null>(null);
  const [displaySize, setDisplaySize] = useState<Size | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [editor, setEditor] = useState<EditorState>({
    fontFamily: DEFAULT_FONT_FAMILY,
    zoom: 1,
    pan: { x: 0, y: 0 },
    splitDivider: { color: "#00bfff", width: 2 },
    rectStrokeWidth: 1.25,
  rectStrokeColor: "#222222",
  });
  const [showEditorBackground, setShowEditorBackground] = useState<boolean>(true);

  // debug: log changes
  React.useEffect(() => {
    try { console.log('ImageEditor showEditorBackground ->', showEditorBackground); } catch (err) {}
  }, [showEditorBackground]);

  const {
    rects,
    setRects,
    selectedRectIds,
    setSelectedRectIds,
    onRectClick,
    onRectPointerDown,
    onHandlePointerDown,
    onBlockClick,
  activeBlock,
  setActiveBlock,
    onSeparatorDown,
    addRect,
    deleteSelectedRects,
    undo,
    redo,
  } = useRects({
    editorZoom: () => editor.zoom,
    displaySizeGetter: () => displaySize,
    origSizeGetter: () => origSize,
    rectStrokeWidth: () => editor.rectStrokeWidth,
  });

  // 仕様：選択は rect 基準。Block Inspector は block をクリックした時だけ出す。
  const [activeRectId, setActiveRectId] = useState<number | string | null>(null);
  const { onPanPointerDown, clampPan } = usePan({
    getZoom: () => editor.zoom,
    getDisplaySize: () => displaySize,
    getPan: () => editor.pan,
    setPan: (p) => setEditor((s) => ({ ...s, pan: p })),
  });

  const onPickImage = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    const fr = new FileReader();
    fr.onload = () => setImageDataUrl(String(fr.result));
    fr.readAsDataURL(file);
    setRects((): RectDef[] => []);
    setSelectedRectIds(new Set());
    setActiveRectId(null);
    setActiveBlock(null);
  }, [setRects, setSelectedRectIds]);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const w = (e.target as HTMLImageElement).naturalWidth;
    const h = (e.target as HTMLImageElement).naturalHeight;
    if (!w || !h) return;

    setOrigSize({ width: w, height: h });

    // 初回のみフィット → 固定
    let targetW = w, targetH = h;
    if (containerRef.current) {
      const cw = containerRef.current.clientWidth || w;
      const ratio = cw / w;
      targetW = Math.round(w * ratio);
      targetH = Math.round(h * ratio);
    }
    setDisplaySize({ width: targetW, height: targetH });
    setEditor((s) => ({ ...s, zoom: 1, pan: { x: 0, y: 0 } }));
  }, []);

  const origToDisplayRect = useCallback((r: { x: number; y: number; width: number; height: number }) => {
    if (!origSize || !displaySize) return { x: r.x, y: r.y, width: r.width, height: r.height };
    const s = displaySize.width / origSize.width;
    return { x: r.x * s, y: r.y * s, width: r.width * s, height: r.height * s };
  }, [origSize, displaySize]);

  useEffect(() => {
    if (!displaySize) return;
    setEditor((s) => {
      const nextPan = clampPan(s.pan, s.zoom);
      return samePan(nextPan, s.pan) ? s : { ...s, pan: nextPan };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displaySize]);

  const onZoomIn = useCallback(() =>
    setEditor((s) => {
      const nz = Math.min(4, +(s.zoom + 0.25).toFixed(2));
      return { ...s, zoom: nz, pan: clampPan(s.pan, nz) };
    }), [clampPan]);

  const onZoomOut = useCallback(() =>
    setEditor((s) => {
      const nz = Math.max(0.25, +(s.zoom - 0.25).toFixed(2));
      return { ...s, zoom: nz, pan: clampPan(s.pan, nz) };
    }), [clampPan]);

  const onZoomReset = useCallback(() => setEditor((s) => ({ ...s, zoom: 1, pan: { x: 0, y: 0 } })), []);

  const onExportSVG = useCallback(async () => {
    if (!imageUrl || !origSize) return;
    await downloadSVG({
      imageUrl,
      origSize,
      rects,
      fontFamily: editor.fontFamily,
      splitLine: { color: editor.splitDivider.color, width: editor.splitDivider.width },
      embedImages: true,
      excludeRectNumbers: true,
      fileName: "export.svg",
    });
  }, [imageUrl, origSize, rects, editor.fontFamily, editor.splitDivider.color, editor.splitDivider.width]);

  const deepCopyPersist = useCallback((): PersistedProject => ({
    version: 1,
    savedAt: formatDate(new Date(), "YYYY-MM-DD HH:mm:ss"),
    imageDataUrl: imageDataUrl || null,
    state: {
      rects: deepCopy(rects),
      fontFamily: editor.fontFamily,
      splitDivider: { ...editor.splitDivider },
      rectStrokeWidth: editor.rectStrokeWidth,
      rectStrokeColor: editor.rectStrokeColor,
      zoom: editor.zoom,
      pan: { ...editor.pan },
    },
  }), [imageDataUrl, rects, editor.fontFamily, editor.splitDivider, editor.rectStrokeWidth, editor.zoom, editor.pan, editor.rectStrokeColor]);

  const applyPersist = useCallback((p: PersistedProject) => {
    setImageDataUrl(p.imageDataUrl ?? null);
    setImageUrl(p.imageDataUrl ?? null);
    setRects(deepCopy(p.state.rects) as RectDef[]);
    setEditor((s) => ({
      ...s,
      fontFamily: p.state.fontFamily,
      splitDivider: { ...p.state.splitDivider },
      rectStrokeWidth: p.state.rectStrokeWidth,
  rectStrokeColor: p.state.rectStrokeColor ?? "#222222",
      zoom: p.state.zoom,
      pan: { ...p.state.pan },
    }));
    setSelectedRectIds(new Set());
    setActiveRectId(null);
    setActiveBlock(null);
  }, [setRects]);

  const onSaveLocal = useCallback(() => {
    const payload = deepCopyPersist();
    saveToLocal(payload);
    alert(`保存しました: ${payload.savedAt}`);
  }, [deepCopyPersist]);

  const onLoadLocal = useCallback(() => {
    const p = loadFromLocal();
    if (!p) return alert("保存データが見つかりません。");
    applyPersist(p);
    alert(`読み込み完了: ${p.savedAt}`);
  }, [applyPersist]);

  const onExportJSON = useCallback(() => exportToFile(deepCopyPersist(), "project.json"), [deepCopyPersist]);

  const onImportJSON = useCallback(async (file: File | null) => {
    if (!file) return;
    const p = await importFromFile(file);
    if (!p) return alert("不正なJSONです。");
    applyPersist(p);
  }, [applyPersist]);

  const onCanvasBackgroundClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    setSelectedRectIds(new Set());
    setActiveRectId(null);
    setActiveBlock(null);
    setRects((prev: RectDef[]) =>
      prev.map((r) => ({
        ...r,
        blocks: r.blocks?.map((b) => ({ ...b, selected: false })),
      }))
    );
  }, [setSelectedRectIds, setRects]);

  const safeEvent = useMemo(
    () =>
      ({
        stopPropagation: () => {},
        preventDefault: () => {},
        shiftKey: false,
        metaKey: false,
        ctrlKey: false,
        altKey: false,
        buttons: 0,
        button: 0,
      } as unknown as React.MouseEvent),
    []
  );

  // rect 選択のみ。block 選択は解除
  const onRectClickBridge = useCallback(
    (rectId: number) => {
      onRectClick(safeEvent as any, rectId);
      setSelectedRectIds(new Set([rectId]));
      setActiveRectId(rectId);
      setActiveBlock(null);
    },
    [onRectClick, safeEvent, setSelectedRectIds]
  );

  // block をクリックしたときだけ Block Inspector を出す
  const onBlockClickBridge = useCallback(
    (eOrRectId: any, maybeRectId?: any, maybeBlockId?: any) => {
      // support both call signatures:
      //  - (rectId, blockId)    -> older bridge usage
      //  - (e, rectId, blockId) -> BlocksLayer now forwards event
      if (eOrRectId && typeof eOrRectId === "object" && "stopPropagation" in eOrRectId) {
        const e = eOrRectId as React.MouseEvent;
        const rid = maybeRectId as number;
        const bid = maybeBlockId as string;
        onBlockClick(e as any, rid, bid);
        setActiveBlock({ rectId: rid, blockId: bid });
      } else {
        const rid = eOrRectId as number;
        const bid = maybeRectId as string;
        onBlockClick(safeEvent as any, rid, bid);
        setActiveBlock({ rectId: rid, blockId: bid });
      }
    },
    [onBlockClick, safeEvent]
  );

  // 新規 rect 自動選択
  const prevRectIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const curr = new Set(rects.map((r: any) => String(r.id)));
    const prev = prevRectIdsRef.current;
    const added: string[] = [];
    curr.forEach((id) => { if (!prev.has(id)) added.push(id); });
    if (added.length > 0) {
      const addedIdStr = added[added.length - 1];
      const addedRect = rects.find((r: any) => String(r.id) === addedIdStr);
      if (addedRect) {
        const val = (addedRect as any).id as number;
        setSelectedRectIds(new Set([val]));
        setActiveRectId(val);
        setActiveBlock(null);
      }
    }
    prevRectIdsRef.current = curr;
  }, [rects, setSelectedRectIds]);

  // 削除時はクリア
  useEffect(() => {
    if (activeRectId == null) return;
    const exists = rects.some((r: any) => String(r.id) === String(activeRectId));
    if (!exists) setActiveRectId(null);
  }, [rects, activeRectId]);

  return (
    <div style={{ display: "flex", gap: 12 }}>
      <Toolbar
        onPickImage={onPickImage}
        zoom={editor.zoom}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onZoomReset={onZoomReset}
        onUndo={undo}
        onRedo={redo}
  onAddRect={addRect}
        onDeleteSelected={deleteSelectedRects}
        selectedCount={selectedRectIds.size}
  showEditorBackground={showEditorBackground}
  onToggleEditorBackground={(v) => setShowEditorBackground(v)}
        fontFamily={editor.fontFamily}
        onChangeFontFamily={(v) => setEditor((s) => ({ ...s, fontFamily: v }))}
        splitDividerColor={editor.splitDivider.color}
        splitDividerWidth={editor.splitDivider.width}
        onChangeSplitDivider={(color, width) => setEditor((s) => ({ ...s, splitDivider: { color, width } }))}
        rectStrokeWidth={editor.rectStrokeWidth}
        onChangeRectStrokeWidth={(w) => {
          setEditor((s) => ({ ...s, rectStrokeWidth: w }));
          setRects((prev: RectDef[]) => prev.map((r) => ({ ...r, strokeWidth: w })));
        }}
        rectStrokeColor={editor.rectStrokeColor}
        onChangeRectStrokeColor={(c) => {
          setEditor((s) => ({ ...s, rectStrokeColor: c }));
          setRects((prev: RectDef[]) => prev.map((r) => ({ ...r, strokeColor: c })));
        }}
        onSaveLocal={onSaveLocal}
        onLoadLocal={onLoadLocal}
        onExportJSON={onExportJSON}
        onImportJSON={onImportJSON}
        onExportSVG={onExportSVG}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          ref={containerRef}
          style={{ position: "relative", width: "100%", minHeight: 400 }}
          onClick={onCanvasBackgroundClick}
        >
          {imageUrl && (
            <img
              ref={imgRef}
              src={imageUrl}
              onLoad={onImageLoad}
              alt="orig"
              style={{ display: "none" }}
            />
          )}

          <Canvas
            imageUrl={imageUrl}
            displaySize={displaySize}
            zoom={editor.zoom}
            pan={editor.pan}
            onPanPointerDown={onPanPointerDown}
            rects={rects}
            selectedRectIds={selectedRectIds}
            activeBlock={activeBlock}
            fontFamily={editor.fontFamily}
            origToDisplayRect={origToDisplayRect}
            onRectClick={onRectClickBridge}
              onRectPointerDown={onRectPointerDown}
            onHandlePointerDown={onHandlePointerDown}
            onBlockClick={onBlockClickBridge}
            dividerColor={editor.splitDivider.color}
            dividerWidth={editor.splitDivider.width}
              showEditorBackground={showEditorBackground}
            onSeparatorDown={onSeparatorDown}
          />
        </div>

        <BlockInspector
          rects={rects}
          active={activeBlock}
          fontFamily={editor.fontFamily}
          selectedRectIds={selectedRectIds}
          onSplitRect={(rid: number, rows: number, cols: number) => {
            const rN = Math.max(1, Math.floor(rows));
            const cN = Math.max(1, Math.floor(cols));
            setRects((prev: RectDef[]) =>
              prev.map((r: any) => {
                if (String(r.id) !== String(rid)) return r;
                const blocks: BlockDef[] = [];
                for (let rIdx = 0; rIdx < rN; rIdx++) {
                  for (let cIdx = 0; cIdx < cN; cIdx++) {
                    const x = cIdx / cN;
                    const y = rIdx / rN;
                    const width = 1 / cN;
                    const height = 1 / rN;
                    blocks.push({
                      id: `blk_${rIdx}_${cIdx}`,
                      x, y, width, height,
                      text: "",
                      bgColor: "transparent",
                      textAlign: "left",
                      verticalAlign: "top",
                      writingMode: "horizontal-tb",
                      textOrientation: "mixed",
                      fontFamily: editor.fontFamily,
                      fontWeight: "normal",
                      textPadding: { top: 1, right: 1, bottom: 1, left: 1 },
                    } as BlockDef);
                  }
                }
                return { ...r, blocks };
              })
            );
          }}
          onUpdateBlock={(rid: number, bid: string, patch: Partial<BlockDef>) =>
            setRects((prev: RectDef[]) =>
              prev.map((r) =>
                r.id === rid ? { ...r, blocks: r.blocks.map((b: any) => (String(b.id) === String(bid) ? { ...b, ...patch } : b)) } : r
              )
            )
          }
          onBlockImageFile={(rid: number, bid: string, file: File | null) => {
            if (!file) return;
            const url = URL.createObjectURL(file);
            setRects((prev: RectDef[]) =>
              prev.map((r) =>
                r.id === rid ? { ...r, blocks: r.blocks.map((b: any) => (String(b.id) === String(bid) ? { ...b, imageUrl: url } : b)) } : r
              )
            );
          }}
          onBlockIconImageFile={(rid: number, bid: string, file: File | null) => {
            if (!file) return;
            const url = URL.createObjectURL(file);
            setRects((prev: RectDef[]) =>
              prev.map((r) =>
                r.id === rid
                  ? {
                      ...r,
                      blocks: r.blocks.map((b: any) => (String(b.id) === String(bid) ? { ...b, iconImageUrl: url, icon: undefined } : b)),
                    }
                  : r
              )
            );
          }}
          onResetBlockIcon={(rid: number, bid: string) =>
            setRects((prev: RectDef[]) =>
              prev.map((r) =>
                r.id === rid
                  ? {
                      ...r,
                      blocks: r.blocks.map((b: any) =>
                        String(b.id) === String(bid) ? { ...b, icon: undefined, iconImageUrl: undefined } : b
                      ),
                    }
                  : r
              )
            )
          }
        />
      </div>
    </div>
  );
}
