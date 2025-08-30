import { useCallback } from "react";
import { RectDef } from "../types";

const SNAP_MAX_PX = 80;
const SNAP_THRESH_LUMA = 18;
const SNAP_MIN_DELTA = 1;
const SNAP_SAMPLES: number = 7;
const SNAP_INNER_MARGIN = 1;

export function useSnapToColor(imgEl: HTMLImageElement | null, origW: number | null, origH: number | null) {
  return useCallback(async (rects: RectDef[], commit: (next: RectDef[]) => void) => {
    if (!imgEl || !origW || !origH) return;

    const canvas = document.createElement("canvas");
    canvas.width = origW;
    canvas.height = origH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imgEl, 0, 0, origW, origH);
    } catch {
      return;
    }

    const lumaAt = (x: number, y: number) => {
      if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return 0;
      const d = ctx.getImageData(x | 0, y | 0, 1, 1).data;
      return 0.2126 * d[0] + 0.7152 * d[1] + 0.0722 * d[2];
    };

    const snapEdge = (edge: "left" | "right" | "top" | "bottom", r: RectDef) => {
      const cx = Math.round(r.rect.x + r.rect.width / 2);
      const cy = Math.round(r.rect.y + r.rect.height / 2);
      const proposals: number[] = [];
      const samples = Number(SNAP_SAMPLES);
      const denom = Math.max(1, samples - 1);

      for (let i = 0; i < samples; i++) {
        const t = samples <= 1 ? 0.5 : i / denom;
        let sx = cx, sy = cy;

        if (edge === "left" || edge === "right") {
          sy = Math.round(r.rect.y + t * (r.rect.height - 1));
          sx = edge === "left"
            ? Math.max(0, Math.round(r.rect.x + SNAP_INNER_MARGIN))
            : Math.min(canvas.width - 1, Math.round(r.rect.x + r.rect.width - 1 - SNAP_INNER_MARGIN));
        } else {
          sx = Math.round(r.rect.x + t * (r.rect.width - 1));
          sy = edge === "top"
            ? Math.max(0, Math.round(r.rect.y + SNAP_INNER_MARGIN))
            : Math.min(canvas.height - 1, Math.round(r.rect.y + r.rect.height - 1 - SNAP_INNER_MARGIN));
        }

        const cL = lumaAt(sx, sy);

        let best =
          edge === "left" ? r.rect.x :
          edge === "right" ? r.rect.x + r.rect.width :
          edge === "top" ? r.rect.y : r.rect.y + r.rect.height;

        for (let d = 1; d <= SNAP_MAX_PX; d++) {
          let tx = sx, ty = sy;
          if (edge === "left") tx = sx - d;
          else if (edge === "right") tx = sx + d;
          else if (edge === "top") ty = sy - d;
          else ty = sy + d;

          if (tx < 0 || ty < 0 || tx >= canvas.width || ty >= canvas.height) break;
          const L = lumaAt(tx, ty);
          if (Math.abs(L - cL) >= SNAP_THRESH_LUMA) {
            best = (edge === "left" || edge === "top") ? (edge === "left" ? tx + 1 : ty + 1) : (edge === "right" ? tx : ty);
            break;
          }
        }
        proposals.push(best);
      }

      proposals.sort((a, b) => a - b);
      return proposals[Math.floor(proposals.length / 2)];
    };

    const nextRects = JSON.parse(JSON.stringify(rects)) as RectDef[];
    for (const r of nextRects) {
      const L = snapEdge("left", r);
      const R = snapEdge("right", r);
      const T = snapEdge("top", r);
      const B = snapEdge("bottom", r);

      const oldL = r.rect.x, oldR = r.rect.x + r.rect.width, oldT = r.rect.y, oldB = r.rect.y + r.rect.height;

      const changed =
        (L !== undefined && Math.abs(L - oldL) >= SNAP_MIN_DELTA) ||
        (R !== undefined && Math.abs(R - oldR) >= SNAP_MIN_DELTA) ||
        (T !== undefined && Math.abs(T - oldT) >= SNAP_MIN_DELTA) ||
        (B !== undefined && Math.abs(B - oldB) >= SNAP_MIN_DELTA);

      if (changed) {
        const nx = L ?? oldL;
        const nr = R ?? oldR;
        const ny = T ?? oldT;
        const nb = B ?? oldB;
        r.rect.x = Math.max(0, Math.min(nx, nr - 1));
        r.rect.y = Math.max(0, Math.min(ny, nb - 1));
        r.rect.width = Math.max(8, Math.abs(nr - nx));
        r.rect.height = Math.max(8, Math.abs(nb - ny));
      }
    }

    const prevS = JSON.stringify(rects);
    const nextS = JSON.stringify(nextRects);
    if (prevS !== nextS) commit(nextRects);
  }, [imgEl, origW, origH]);
}
