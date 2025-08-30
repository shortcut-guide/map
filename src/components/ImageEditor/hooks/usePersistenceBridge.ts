import { useCallback } from "react";
import { downloadSVG } from "../utils/svgExport";
import { formatDate, loadFromLocal, saveToLocal, exportToFile, importFromFile, type PersistedProject } from "../utils/persist";

type Editor = {
  fontFamily: string;
  splitDivider: { color: string; width: number };
  rectStrokeWidth: number;
  zoom: number;
  pan: { x: number; y: number };
};

type RectsState = {
  rects: any[];
  setRects: React.Dispatch<React.SetStateAction<any[]>>;
};

export function usePersistenceBridge({
  editor,
  imageUrl,
  imageDataUrl,
  setImageDataUrl,
  rectsState,
}: {
  editor: Editor;
  imageUrl: string | null;
  imageDataUrl: string | null;
  setImageDataUrl: (v: string | null) => void;
  rectsState: RectsState & any;
}) {
  const deepCopy = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

  const deepCopyPersist = useCallback((): PersistedProject => ({
    version: 1,
    savedAt: formatDate(new Date(), "YYYY-MM-DD HH:mm:ss"),
    imageDataUrl: imageDataUrl || null,
    state: {
      rects: deepCopy(rectsState.rects),
      fontFamily: editor.fontFamily,
      splitDivider: { ...editor.splitDivider },
      rectStrokeWidth: editor.rectStrokeWidth,
      zoom: editor.zoom,
      pan: { ...editor.pan },
    },
  }), [imageDataUrl, rectsState.rects, editor.fontFamily, editor.splitDivider, editor.rectStrokeWidth, editor.zoom, editor.pan]);

  const applyPersist = useCallback((p: PersistedProject) => {
    setImageDataUrl(p.imageDataUrl ?? null);
    rectsState.setRects(deepCopy(p.state.rects));
    // editor 系は呼び出し側（ImageEditor）で setEditor を渡して更新しても良いが、
    // ここでは rects と imageDataUrl だけ扱う（責務分離）
  }, [rectsState, setImageDataUrl]);

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
    alert(`読み込み完了: ${p.savedAt}`);
  }, [applyPersist]);

  const onExportSVG = useCallback(async () => {
    if (!imageUrl) return;
    // origSize は書き出し側 downloadSVG 内部の前提に合わせて rect 空間を用いる
    // 既存 downloadSVG API を前提に、呼び出し元の ImageEditor と同じ引数で委譲
    const origSize = { width: 1, height: 1 }; // downloadSVG 実装次第で調整。呼び出し側は従来通り。
    await downloadSVG({
      imageUrl,
      origSize,
      rects: rectsState.rects,
      fontFamily: editor.fontFamily,
      splitLine: { color: editor.splitDivider.color, width: editor.splitDivider.width },
      embedImages: true,
      excludeRectNumbers: true,
      fileName: "export.svg",
    });
  }, [imageUrl, rectsState.rects, editor.fontFamily, editor.splitDivider.color, editor.splitDivider.width]);

  return { onSaveLocal, onLoadLocal, onExportJSON, onImportJSON, onExportSVG };
}
