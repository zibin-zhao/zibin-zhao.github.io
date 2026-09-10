# Lanting source and character map

Source retrieved September 9, 2026. Manuscript fidelity and entry regions reviewed September 10, 2026.

## Reproduction

- Identity: _Lanting Xu_, Feng Chengsu's Tang-dynasty copy after Wang Xizhi. This is a surviving copy, not Wang Xizhi's lost original.
- Collection reference: [Palace Museum](https://www.dpm.org.cn/collection/handwriting/228279.html).
- Used file and licensing record: [Wikimedia Commons, LantingXu.jpg](https://commons.wikimedia.org/wiki/File:LantingXu.jpg).
- Binary source: `https://upload.wikimedia.org/wikipedia/commons/f/f1/LantingXu.jpg`.
- Local original: `public/lanting/lantingxu.jpg`, 4513 x 1480 pixels.
- SHA-256: `b2cb481ea097d5fc8188389f787eb9b45369d8ad0489e02b17a80d9697a2eb54`.
- The Commons record identifies this file as public domain, with PD-Art and PD-old-100-expired metadata. The retrieved record is retained in `artifacts/lanting-2026-09-09/wikimedia-source.json`.

The complete manuscript renders this file once as an image at its original aspect ratio. No source pixels, colors, line positions, spacing, corrections, or seals are altered. A native horizontal viewport makes the whole image reachable on small screens. The initial view aligns with the opening text; the outside margins remain scrollable. The former cropped-column and replacement-lettering system has been removed.

Interaction regions use a coordinate width of 2048 and the exact proportional height, `1480 / 4513 * 2048`. Every region was inspected with surrounding characters visible in the source. Rectangles locate transparent links without cutting the manuscript. Highlight isolates the ink of those regions at its original position and scale, temporarily softening the rest of the manuscript with a paper veil. The approached, hovered, or focused region enlarges to 114%; a feathered copy of the same source paper prevents doubled strokes. Closing Highlight and leaving the region restores the unchanged base rendering. The current map is in `src/data/lanting.ts`. Separate reader cues quote continuous source regions, and UI lettering outside the manuscript still uses the smaller collected-character map. No synthetic lettering is used.

## Original-word entries

| Original text | Source context           | Destination              |
| ------------- | ------------------------ | ------------------------ |
| 觀            | 仰觀宇宙之大             | DNA-guided Cas12a record |
| 宇宙之大      | 仰觀宇宙之大俯察品類之盛 | Singularity              |
| 品類          | 俯察品類之盛             | CasMD                    |
| 信            | 信可樂也                 | Contact                  |
| 人            | 夫人之相與               | Zibin Zhao introduction  |
| 取            | 或取諸懷抱               | DL-SELEX                 |
| 言            | 悟言一室之內             | Prompt library           |
| 靜            | 趣舍萬殊靜躁不同         | Medit                    |
| 隨            | 情隨事遷                 | Yaos                     |
| 事            | 情隨事遷                 | CV                       |
| 時            | 故列敘時人               | TEMPO                    |
| 蘭亭          | 會于會稽山陰之蘭亭       | Contents                 |

These are existing words linked to interpretive destinations, not renamed projects or inserted text. The true names, summaries, contributions, and URLs come from the existing canonical data. In particular, the opening keeps `會于會稽山陰之蘭亭`, and `宇宙之大` remains in its original place between `觀` and `俯`. The title is accessible-only; the compact 一觀 control sits outside the original image.

The conditional history control quotes `昔` from `每覽昔人`, at `[454, 307, 56, 62]` in the same coordinate system. This small UI glyph is outside the manuscript and does not add another word to the base scan. Its source and surroundings were visually inspected during the September 10 refinement; `artifacts/manuscript-discovery/past-glyph-study.png` retains the calibration view.

## Transcript reference

The original image is retained separately from the authored composition. A traditional-Chinese reference reading is saved in `docs/lanting-reference-transcript.txt`, extracted from the [National Palace Museum Dingwu Lanting catalog](https://digitalarchive.npm.gov.tw/Collection/Detail/14853?dep=P). That record represents a different copy and has textual variants. It is explicitly a reading reference, not a claimed diplomatic transcription of the Feng Chengsu image. The retrieved catalog HTML is retained with the artifacts.

## Complete-font limitation

The official [Founder Wang Xizhi Running Script page](https://www.foundertype.com/index.php/FontInfo/index/id/6716) describes a simplified/traditional GBK family and requires the relevant license. The retrieved authorization text is retained in `artifacts/lanting-2026-09-09/founder-license.html`. No license was acquired, no font binary was downloaded, and no commercial font was embedded.

The opening's calligraphic display has source coverage for all of its selected cues. Long descriptions, the complete Chinese navigation/index, and arbitrary publication text exceed that small character set. The current reading layer uses Georgia and Chinese system serif fallbacks. The sourced controls are image quotations, not a complete Wang Xizhi font.
