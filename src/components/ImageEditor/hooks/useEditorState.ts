import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePan } from "../hooks/usePan";
import { useRects } from "../hooks/useRects";
import { toDisplayRectFactory } from "../utils/rectTransform";

const DEFAULT_FONT_FAMILY = "'Noto Sans JP', sans-serif";

type Size = { width: number; height: number };
type Pan = { x: number; y: number };

export function useEditorState() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [origSize, setOrigSize] = useState<Size | null>(null);
  const [displaySize, setDisplaySize] = useState<Size | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [editor, setEditor] = useState({
    fontFamily: DEFAULT_FONT_FAMILY,
    zoom: 1,
    pan: { x: 0, y: 0 } as Pan,
    splitDivider: { color: "#00bfff", width: 2 },
    rectStrokeWidth: 1.25,
  });

  const rectsState = useRects({
    editorZoom: () => editor.zoom,
    displaySizeGetter: () => displaySize,
    origSizeGetter: () => origSize,
    rectStrokeWidth: () => editor.rectStrokeWidth,
  });

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
    rectsState.setRects([]);
    rectsState.setSelectedRectIds(new Set());
    rectsState.setActiveBlock(null);
  }, [rectsState]);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.target as HTMLImageElement;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) return;

    setOrigSize({ width: w, height: h });

    let targetW = w;
    let targetH = h;
    if (containerRef.current) {
      const cw = containerRef.current.clientWidth || w;
      const ratio = cw / w;
      targetW = Math.round(w * ratio);
      targetH = Math.round(h * ratio);
    }
    setDisplaySize({ width: targetW, height: targetH });
    setEditor((s) => ({ ...s, zoom: 1, pan: { x: 0, y: 0 } }));
  }, []);

  const origToDisplayRect = useMemo(
    () => toDisplayRectFactory(origSize, displaySize),
    [origSize, displaySize]
  );

  useEffect(() => {
    if (!displaySize) return;
    setEditor((s) => {
      const nextPan = clampPan(s.pan, s.zoom);
      return nextPan.x === s.pan.x && nextPan.y === s.pan.y ? s : { ...s, pan: nextPan };
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

  const onCanvasBackgroundClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    rectsState.setSelectedRectIds(new Set());
    rectsState.setActiveBlock(null);
    rectsState.setRects((prev) =>
      prev.map((r) => ({
        ...r,
        blocks: r.blocks?.map((b) => ({ ...b, selected: false })),
      }))
    );
  }, [rectsState]);

  return {
    editor,
    setEditor,
    imageUrl,
    imageDataUrl,
    setImageDataUrl,
    origSize,
    displaySize,
    containerRef,
    imgRef,
    onPickImage,
    onImageLoad,
    onCanvasBackgroundClick,
    onZoomIn,
    onZoomOut,
    onZoomReset,
    origToDisplayRect,
    onPanPointerDown,
    rectsState,
  };
}
