import { EditorState } from "../types";

// 保存キー
const STORAGE_KEY = "image_editor_state";

// 現在時刻のファイル名用フォーマット
export function getDateString() {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, "-");
}

// ローカルストレージに保存
export function saveState(state: EditorState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ローカルストレージから読み込み
export function loadState(): EditorState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

// JSONファイルとしてエクスポート
export function exportState(state: EditorState) {
  const blob = new Blob([JSON.stringify(state)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `image_editor_${getDateString()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// JSONファイルからインポート
export function importState(file: File): Promise<EditorState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result as string));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
