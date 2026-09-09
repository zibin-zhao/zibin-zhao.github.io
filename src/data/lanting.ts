// Display coordinates refer to the unmodified 4513 x 1480 Wikimedia reproduction.
// This 2048 x 672 coordinate space was manually inspected against the scan.
export const inkSource = '/lanting/lantingxu.jpg';
export const sourceSize = { width: 2048, height: 671.7 };
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
export const columns = [
  1808, 1735, 1659, 1590, 1519, 1450, 1386, 1319, 1248, 1184, 1112, 1043, 978, 906, 839, 765, 692,
  618, 551, 485, 417, 349, 282, 215, 154, 91, 30,
];
export const fragments = [
  { id: 'about', column: 1, cut: [138, 251], glyphs: '與人', entry: 9 },
  { id: 'casmd', column: 3, cut: [324, 456], glyphs: '觀形', entry: 1 },
  { id: 'medit', column: 5, cut: [77, 186], glyphs: '靜觀', entry: 3 },
  { id: 'singularity', column: 8, cut: [238, 460], glyphs: '宇宙之大', entry: 5 },
  { id: 'dlselex', column: 10, cut: [427, 529], glyphs: '取類', entry: 2 },
  { id: 'tempo', column: 12, cut: [125, 231], glyphs: '察品', entry: 4 },
  { id: 'yaos', column: 15, cut: [230, 348], glyphs: '隨時', entry: 6 },
  { id: 'research', column: 18, cut: [75, 191], glyphs: '觀察', entry: 0 },
  { id: 'prompts', column: 20, cut: [342, 431], glyphs: '言之', entry: 10 },
  { id: 'contact', column: 23, cut: [156, 204], glyphs: '信', entry: 11 },
  { id: 'cv', column: 25, cut: [379, 442], glyphs: '事', entry: 12 },
] as const;
