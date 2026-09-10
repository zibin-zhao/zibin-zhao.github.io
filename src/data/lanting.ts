// The manuscript is rendered once, intact. These coordinates only locate overlays.
// Regions were inspected with their surrounding text in the original reproduction.
export const inkSource = '/lanting/lantingxu.jpg';
export const sourcePixels = { width: 4513, height: 1480 };
export const sourceSize = { width: 2048, height: (1480 / 4513) * 2048 };
// Initial viewport aligns with the opening column. Outer seals remain scrollable.
export const writingStart = 1850 / sourceSize.width;
export type InkCrop = readonly [number, number, number, number];
export const glyphs = {
  觀: [1212, 5, 70, 71],
  宇: [1215, 78, 66, 56],
  宙: [1217, 143, 61, 40],
  之: [1220, 196, 63, 47],
  大: [1211, 241, 76, 43],
  察: [1210, 347, 70, 66],
  品: [1215, 417, 64, 44],
  類: [1210, 466, 71, 56],
  形: [945, 394, 60, 48],
  靜: [875, 241, 62, 53],
  一: [1006, 17, 72, 24],
  取: [1007, 144, 65, 54],
  與: [1074, 470, 62, 59],
  人: [1075, 346, 62, 44],
  事: [711, 86, 49, 45],
  隨: [706, 7, 60, 62],
  時: [136, 78, 61, 60],
  信: [1078, 68, 60, 52],
  言: [1013, 437, 58, 50],
  蘭: [1702, 352, 62, 64],
  亭: [1705, 420, 62, 57],
} satisfies Record<string, InkCrop>;
export type Glyph = keyof typeof glyphs;
// Reading order follows the original columns, right to left and top to bottom.
// Every phrase already exists at its region. Never replace or redraw these words.
export const fragments = [
  { id: 'research', phrase: '觀', region: [1207, 0, 80, 77], entry: 0 },
  { id: 'singularity', phrase: '宇宙之大', region: [1207, 77, 80, 212], entry: 5 },
  { id: 'casmd', phrase: '品類', region: [1207, 412, 80, 116], entry: 1 },
  { id: 'contact', phrase: '信', region: [1072, 66, 73, 59], entry: 11 },
  { id: 'about', phrase: '人', region: [1075, 346, 62, 44], entry: 9 },
  { id: 'dlselex', phrase: '取', region: [1003, 140, 76, 62], entry: 2 },
  { id: 'prompts', phrase: '言', region: [1007, 431, 73, 60], entry: 10 },
  { id: 'medit', phrase: '靜', region: [869, 235, 75, 66], entry: 3 },
  { id: 'yaos', phrase: '隨', region: [700, 0, 75, 73], entry: 6 },
  { id: 'cv', phrase: '事', region: [704, 79, 69, 61], entry: 12 },
  { id: 'tempo', phrase: '時', region: [147, 83, 61, 59], entry: 4 },
] as const;
