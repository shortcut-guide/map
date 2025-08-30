// src/components/ImageEditor/utils/coords.ts
export type Size = { width: number; height: number };
export type Rect = { x: number; y: number; width: number; height: number };

export function origToDisplayRect(r: Rect, origSize: Size | null, displaySize: Size | null): Rect {
  if (!origSize || !displaySize) return { ...r };
  const s = displaySize.width / origSize.width;
  return { x: r.x * s, y: r.y * s, width: r.width * s, height: r.height * s };
}

export function displayToOrigRect(r: Rect, origSize: Size | null, displaySize: Size | null): Rect {
  if (!origSize || !displaySize) return { ...r };
  const inv = origSize.width / displaySize.width;
  return { x: r.x * inv, y: r.y * inv, width: r.width * inv, height: r.height * inv };
}
