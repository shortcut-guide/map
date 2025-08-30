export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function escapeXml(s = "") {
  return s.replace(/[<>&'"]/g, (c) =>
    c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : c === "'" ? "&apos;" : "&quot;"
  );
}
