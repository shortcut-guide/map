type Size = { width: number; height: number };
type Rect = { x: number; y: number; width: number; height: number };

export function toDisplayRectFactory(origSize: Size | null, displaySize: Size | null) {
  if (!origSize || !displaySize) {
    return (r: Rect): Rect => ({ ...r });
  }
  const s = displaySize.width / origSize.width;
  return (r: Rect): Rect => ({
    x: r.x * s,
    y: r.y * s,
    width: r.width * s,
    height: r.height * s,
  });
}
