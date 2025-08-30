import type { BlockDef } from "../../types";

export function getBoundaries(blocks: BlockDef[], posKey: "x" | "y", sizeKey: "width" | "height") {
  const sorted = [...blocks].sort((a, b) => a[posKey] - b[posKey]);
  const res: Array<{ t: number; index: number }> = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const left = sorted[i];
    const t = +(left[posKey] + left[sizeKey]).toFixed(6);
    if (t > 1e-6 && t < 1 - 1e-6) res.push({ t, index: i });
  }
  return res;
}
