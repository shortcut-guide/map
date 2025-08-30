// src/components/ImageEditor/types.ts
export type Vec2 = { x: number; y: number };
export type Size = { width: number; height: number };
export type Rect = Vec2 & Size;
export type Inset = { top: number; right: number; bottom: number; left: number };

export type BlockDef = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;

  bgColor?: string;

  text?: string;

  // ★ 縦書き/横書き & 文字の縦向き
  writingMode?: "horizontal-tb" | "vertical-rl";
  textOrientation?: "mixed" | "upright";

  fontFamily?: string;
  fontAuto?: boolean;
  fontWeight?: number | "normal" | "bold";
  textAlign?: "left" | "center" | "right";
  verticalAlign?: "top" | "center" | "bottom";
  textPadding?: Inset;

  imageUrl?: string;
  icon?: string;
  iconImageUrl?: string;
  iconOffset?: Vec2;

  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  overflowVisible?: boolean;

  selected?: boolean;
};

export type RectDef = {
  id: number;
  color: string;
  rect: Rect;
  blocks: BlockDef[];
  strokeWidth?: number;
  strokeGradient?: { enabled: boolean; from: string; to: string; angleDeg: number };
};

export type SplitStyle = {
  dividerColor: string;
  dividerWidth: number;
  blockStrokeColor: string;
  blockStrokeWidth: number;
};

export type ActiveBlock = { rectId: number; blockId: string } | null;

export type EditorState = {
  imageUrl: string | null;
  origSize: Size | null;
  rects: RectDef[];
  selectedRectIds: Set<number>;
  activeBlock: ActiveBlock;
  displaySize: Size | null;
  zoom: number;
  pan: Vec2;
  fontFamily: string;
  rectStrokeWidth: number;
  splitLineColor: string;
  splitLineWidth: number;
  splitSelectStrokeWidth: number;
};
