let __editorGradCounter = 0;
const __editorGradMap: Record<string, { id: string; raw: string }> = {};

function genEditorGradId() {
  __editorGradCounter += 1;
  return `rl_grad_${__editorGradCounter}`;
}

function parseLinearGradientString(input: string) {
  const inner = input.replace(/^\s*linear-gradient\s*\(\s*/i, "").replace(/\)\s*$/, "");
  const parts = inner.split(/\s*,\s*/);
  let anglePart = "90deg";
  if (/^\d+deg$/.test(parts[0]) || /^to\s+/i.test(parts[0])) anglePart = parts.shift()!;
  const stops = parts.map((s) => s.trim());
  return { anglePart, stops };
}

function angleToXY(anglePart: string) {
  const degMatch = anglePart.match(/(-?\d+(?:\.\d+)?)deg/);
  let deg = 90;
  if (degMatch) deg = Number(degMatch[1]);
  const rad = (deg - 90) * (Math.PI / 180);
  const dx = Math.cos(rad), dy = Math.sin(rad);
  const x1 = (0.5 - dx / 2) * 100, y1 = (0.5 - dy / 2) * 100;
  const x2 = (0.5 + dx / 2) * 100, y2 = (0.5 + dy / 2) * 100;
  return { x1: `${x1}%`, y1: `${y1}%`, x2: `${x2}%`, y2: `${y2}%` };
}

export function registerEditorGradient(gradStr: string) {
  if (__editorGradMap[gradStr]) return __editorGradMap[gradStr];
  const id = genEditorGradId();
  const { anglePart, stops } = parseLinearGradientString(gradStr);
  const { x1, y1, x2, y2 } = angleToXY(anglePart);
  const parsed = stops.map((s, i) => {
    const m = s.match(/^(.+?)\s+(\d+%|\d+(?:\.\d+)?%)$/);
    if (m) return { color: m[1].trim(), offset: m[2].trim() };
    return { color: s.trim(), offset: `${Math.round((i / (stops.length - 1 || 1)) * 100)}%` };
  });
  const rawStops = parsed.map((p) => `<stop offset="${p.offset}" stop-color="${p.color}"/>`).join("");
  const raw = `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" gradientUnits="objectBoundingBox">${rawStops}</linearGradient>`;
  __editorGradMap[gradStr] = { id, raw };
  return __editorGradMap[gradStr];
}

export function injectEditorDefsToRoot() {
  const defsList = Object.values(__editorGradMap).map((v) => v.raw);
  if (defsList.length === 0) return;
  const svg = document.querySelector("svg");
  if (!svg) return;
  if (svg.querySelector("linearGradient[id^='rl_grad_']")) return;
  const ns = "http://www.w3.org/2000/svg";
  const defs = document.createElementNS(ns, "defs");
  defs.innerHTML = defsList.join("");
  svg.insertBefore(defs, svg.firstChild);
}