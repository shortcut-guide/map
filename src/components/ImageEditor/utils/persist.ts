// src/components/ImageEditor/utils/persist.ts
export type DateFormat = "YYYY-MM-DD HH:mm:ss";

export function formatDate(d: Date, fmt: DateFormat = "YYYY-MM-DD HH:mm:ss") {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  if (fmt === "YYYY-MM-DD HH:mm:ss") return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
  return d.toISOString();
}

export type PersistedProject = {
  version: number;
  savedAt: string;
  imageDataUrl: string | null;
  state: {
    rects: any[];
    fontFamily: string;
    splitDivider: { color: string; width: number };
    rectStrokeWidth: number;
    // 追加：Toolbar / Editor で保持する rect stroke 色
    rectStrokeColor?: string;
    zoom: number;
    pan: { x: number; y: number };
  };
};

const STORAGE_KEY = "image-editor-project@v1";

export function saveToLocal(p: PersistedProject) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export function loadFromLocal(): PersistedProject | null {
  const s = localStorage.getItem(STORAGE_KEY);
  if (!s) return null;
  try {
    const obj = JSON.parse(s);
    if (obj && obj.version === 1) return obj as PersistedProject;
  } catch {}
  return null;
}

export function exportToFile(p: PersistedProject, fileName = "project.json") {
  const blob = new Blob([JSON.stringify(p, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importFromFile(file: File): Promise<PersistedProject | null> {
  const text = await file.text();
  try {
    const obj = JSON.parse(text);
    if (obj && obj.version === 1) return obj as PersistedProject;
    return null;
  } catch {
    return null;
  }
}
