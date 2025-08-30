import React from "react";

export default function SvgRoot({
  width,
  height,
  onPanPointerDown,
  children,
}: {
  width: number;
  height: number;
  onPanPointerDown: (e: React.PointerEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ cursor: "default", userSelect: "none", touchAction: "none" }}
      onPointerDown={(e) => {
        const tag = (e.target as HTMLElement).tagName.toLowerCase();
        if (tag === "svg" || tag === "image") onPanPointerDown(e);
      }}
      role="img"
      aria-label="image editor canvas"
    >
      <defs>
        <filter id="blockSelGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#3b82f6" floodOpacity="0.9" />
        </filter>
      </defs>
      {children}
    </svg>
  );
}
