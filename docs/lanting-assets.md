# Lanting source and character map

Retrieved and inspected September 9, 2026.

## Reproduction

- Identity: _Lanting Xu_, Feng Chengsu's Tang-dynasty copy after Wang Xizhi. This is a surviving copy, not Wang Xizhi's lost original.
- Collection reference: [Palace Museum](https://www.dpm.org.cn/collection/handwriting/228279.html).
- Used file and licensing record: [Wikimedia Commons, LantingXu.jpg](https://commons.wikimedia.org/wiki/File:LantingXu.jpg).
- Binary source: `https://upload.wikimedia.org/wikipedia/commons/f/f1/LantingXu.jpg`.
- Local original: `public/lanting/lantingxu.jpg`, 4513 x 1480 pixels.
- SHA-256: `b2cb481ea097d5fc8188389f787eb9b45369d8ad0489e02b17a80d9697a2eb54`.
- The Commons record identifies this file as public domain, with PD-Art and PD-old-100-expired metadata. The retrieved record is retained in `artifacts/lanting-2026-09-09/wikimedia-source.json`.

No pixels in the source file were edited. SVG viewports crop the reproduction at render time, and a shared SVG color/alpha filter separates ink from the photographic paper. CSS reflows columns and combines individual source characters. The inserted cues and responsive arrangement are contemporary authorship. The public source link lets the reader inspect the unmodified historical composition.

The digitization was manually reviewed in a collected-character study. Exact source windows use a 2048 x 671.7 coordinate system and are retained in `src/data/lanting.ts`. A nested SVG clips each window before layout, preventing adjacent characters from leaking into tall glyph boxes. No image generator or synthetic lettering was used.

## Authored insertions

| Collected text | Destination              |
| -------------- | ------------------------ |
| 與人           | Zibin Zhao introduction  |
| 觀形           | CasMD                    |
| 靜觀           | Medit                    |
| 宇宙之大       | Singularity              |
| 取類           | DL-SELEX                 |
| 察品           | TEMPO                    |
| 隨時           | Yaos                     |
| 觀察           | DNA-guided Cas12a record |
| 言之           | Prompt library           |
| 信             | Contact                  |
| 事             | CV                       |

These are interpretive entry cues, not renamed projects or scientific descriptions. The true names, summaries, contributions, and URLs come from the existing canonical data. The title uses 蘭亭, the reveal control 一觀, and the pointer hint 觀之. All characters used by these display elements are present in the local coordinate map; unknown characters throw at build time instead of silently falling back.

## Transcript reference

The original image is retained separately from the authored composition. A traditional-Chinese reference reading is saved in `docs/lanting-reference-transcript.txt`, extracted from the [National Palace Museum Dingwu Lanting catalog](https://digitalarchive.npm.gov.tw/Collection/Detail/14853?dep=P). That record represents a different copy and has textual variants. It is explicitly a reading reference, not a claimed diplomatic transcription of the Feng Chengsu image. The retrieved catalog HTML is retained with the artifacts.

## Complete-font limitation

The official [Founder Wang Xizhi Running Script page](https://www.foundertype.com/index.php/FontInfo/index/id/6716) describes a simplified/traditional GBK family and requires the relevant license. The retrieved authorization text is retained in `artifacts/lanting-2026-09-09/founder-license.html`. No license was acquired, no font binary was downloaded, and no commercial font was embedded.

The opening's calligraphic display has source coverage for all of its selected cues. Long descriptions, the complete Chinese navigation/index, and arbitrary publication text exceed that small character set. They use system serif typography, while Latin identifiers retain Manrope/Georgia. The user's all-Chinese-in-Wang-Xizhi-type requirement is therefore only partially satisfied by this local prototype. Completing it requires a suitable full-font license or a larger verified and legally usable collected-character source.
