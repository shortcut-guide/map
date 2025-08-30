import React from "react";

export default function BackgroundLayer({ width, height, imageUrl }: { width: number; height: number; imageUrl?: string | null }) {
  // always draw image (or white) unchanged; editor-only visuals are handled in RectsLayer
  try { /* eslint-disable-next-line no-console */ console.log('BackgroundLayer render image:', !!imageUrl); } catch (err) {}
  return (
    <g>
      {imageUrl ? (
        <image
          href={imageUrl}
          x={0}
          y={0}
          width={width}
          height={height}
          preserveAspectRatio="none"
        />
      ) : (
        <rect x={0} y={0} width={width} height={height} fill="#ffffff" />
      )}
    </g>
  );
}
