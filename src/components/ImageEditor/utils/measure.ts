export function createMeasureCtx() {
  const c = document.createElement("canvas");
  return c.getContext("2d");
}

export function computeFitFontSize(
  text: string,
  w: number,
  h: number,
  family: string,
  writing: "horizontal-tb" | "vertical-rl",
  max = 48,
  min = 8
) {
  const ctx = createMeasureCtx();
  if (!ctx) return 14;
  const lines = String(text).split(/\n/);
  let lo = min,
    hi = max,
    ans = min;

  for (let iter = 0; iter < 12; iter++) {
    const mid = Math.floor((lo + hi) / 2);
    ctx.font = `${mid}px ${family}`;
    if (writing === "vertical-rl") {
      let maxCharW = 0;
      for (const line of lines) for (const ch of line) maxCharW = Math.max(maxCharW, ctx.measureText(ch).width);
      const totalW = maxCharW * lines.length;
      const ok = totalW <= w && mid * Math.max(...lines.map((ln) => ln.length || 1)) <= h;
      if (ok) {
        ans = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    } else {
      const lineH = mid * 1.2;
      const totalH = lineH * lines.length;
      const maxW = Math.max(...lines.map((ln) => ctx.measureText(ln).width), 0);
      const ok = maxW <= w && totalH <= h;
      if (ok) {
        ans = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
  }
  return ans;
}
