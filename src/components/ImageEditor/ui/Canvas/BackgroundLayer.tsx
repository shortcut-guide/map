import React from "react";

export default function BackgroundLayer({ width, height, imageUrl }: { width: number; height: number; imageUrl: string }) {
  return (
    <image
      href={imageUrl}
      x={0}
      y={0}
      width={width}
      height={height}
      preserveAspectRatio="none"
      style={{ pointerEvents: "none" }}
    />
  );
}
