# Interactive archive trial verification

Date: September 8, 2026, Asia/Shanghai. Scope: nine real content-bearing, independently selectable archive leaves and the same-page reader. This local implementation supersedes the previous blank-leaf kinetic trial. Local implementation and verification are complete. The 88-case full browser run passed 87 cases and exposed one desktop reader contrast failure; after its two color corrections, both desktop and mobile reader/artwork checks passed. This is combined coverage from the linked runs, not a claim of one uninterrupted 88-case pass.

## Current implementation

Each leaf is printed from its own canonical content entry. Selecting a leaf changes its individual pose and opens its record on the homepage. A native collection launcher, Previous/Next buttons, and a nine-button index provide access to all entries without requiring precise canvas picking. Paging wraps through the collection. Escape or close hides the reader and restores focus to the launcher; Left/Right keys page while focus is inside the reader.

The reader displays a title, source/category line, full description or paper title, contribution or exact author string, and actual destination links. Reduced motion starts with a still composition and still permits selection, paging, and reading. Selecting a leaf does not require enabling ambient motion.

The reader is a non-modal region. It does not require a full page navigation to select another work. A returned browser page resets reader DOM state before mounting a new scene, so cached open markup cannot leave the close action out of sync.

`src/components/ArchiveReader.astro` defines the HTML reader and controls. `src/lib/archive-content.ts` maps existing records. `src/scripts/kinetic-field.ts` connects picking, selection, pose, camera, reading state, and lifecycle. `kinetic-objects.ts` constructs and prints the independently articulated leaves. Existing interior routes and the supporting collection remain available.

## Exact content map

| Leaf | Canonical ID            | Work                                          |
| ---- | ----------------------- | --------------------------------------------- |
| 1    | `nature-biotech-cas12a` | DNA-guided Cas12a paper, Nature Biotechnology |
| 2    | `casmd`                 | CasMD                                         |
| 3    | `dlselex`               | DL-SELEX                                      |
| 4    | `medit`                 | Medit                                         |
| 5    | `tempo`                 | TEMPO                                         |
| 6    | `singularity`           | Singularity                                   |
| 7    | `yaos`                  | Yaos                                          |
| 8    | `ecg-patch-12lead`      | 12-lead ECG patch paper                       |
| 9    | `dna-hydrogel-oect`     | DNA hydrogel/OECT paper                       |

The six projects retain the order and copy in `src/data/projects.ts`. Publication full titles, authors, venue/year, DOI, and any earlier-preprint/correction links are supplied from existing collection records. The featured Cas12a record includes its article, earlier preprint, and author correction. Full English titles and author strings remain exact in both locales. See [archive-content.md](archive-content.md) for field mapping and missing-input behavior. This is reuse of existing records, not new scientific verification or a generated research summary.

## Verification status

| Check                                           | Status            | Scope                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Current static verification                     | PASS              | [Final verify log](../artifacts/archive-2026-09-08/verify-final.log): formatting, ESLint, Astro checks, seven unit tests, and a 15-page build. The existing Three.js chunk-size warning remains.                                                                                         |
| Current browser regression suite                | PASS, scoped runs | [Full run](../artifacts/archive-2026-09-08/browser-final.log): 87 passed and one reader contrast failure. [Reader rerun](../artifacts/archive-2026-09-08/reader-final.log): both cases passed after color corrections. Coverage comprises 14 archive, 26 scene, and 48 portfolio checks. |
| Desktop and portrait visual review              | INSPECTED         | Reviewed 1440 × 1000 and 1280 × 720 desktop views and a 390 × 844 mobile view, including printed real text, individual opening poses, paging, reader links, and return to the collection. Captures are linked below.                                                                     |
| Protected factual content, applications, and CV | PASS              | 28 expected files and 28 current files; all hashes and byte lengths match, with no additions, removals, or changes.                                                                                                                                                                      |
| Performance and sharing-image export            | NOT RECORDED      | No current archive-specific performance measurement or regenerated sharing image is recorded by this documentation branch.                                                                                                                                                               |
| Merge, push, deployment, live verification      | NOT PERFORMED     | The current scope is experimental local implementation and review.                                                                                                                                                                                                                       |

The current content comparison is saved in [content-integrity.json](../artifacts/archive-2026-09-08/content-integrity.json). It pins the earlier 28-file integrity receipt by SHA-256 and compares its expected hashes with the actual file set and bytes. Expected and actual aggregate hash ledgers also match. The protected set is 13 factual data/content files, 11 Medit files, three Singularity files, and `public/cv.pdf`.

The [final source hashes](../artifacts/archive-2026-09-08/source-hashes.json) identify the delivered content mapping, renderer, reader, and tests. Presentation changes can be compared with [the archive task-start record](../artifacts/archive-2026-09-08/task-start.json) and its adjacent `before/` copies. The earlier [kinetic baseline](../artifacts/kinetic-2026-09-08/baseline-manifest.json) remains the factual preservation baseline. These inputs contain the actual uncommitted working tree; Git HEAD is not the trial's comparison baseline.

## Debugging and visual review

The first archive run passed the nine-entry content and paging checks but found that Escape left the launcher unfocusable. A deferred focus attempt alone did not fix it. The recorded diagnostic showed the old selector retained focus and the launcher still had inherited `visibility: hidden`, while the document itself had focus. The final implementation uses the launch button's native `hidden` state directly and restores it before focusing. Both desktop and mobile close/focus cases passed in [focus-fixed.log](../artifacts/archive-2026-09-08/focus-fixed.log). Earlier failure evidence remains retained, including [the first archive run](../artifacts/archive-2026-09-08/archive-tests.log).

The artwork comparison masks the HTML reader, labels, and controls and compares actual canvas captures with ambient animation stopped. This checks that selecting another work changes the physical rendering as well as the text. An axe scan inspects the open reader. The first desktop scan found two low-contrast colors in its selected row; the number and hover colors were darkened, and the final two-platform rerun passed. The JSON data script also declares its already-implicit inline mode explicitly; the final static check covers that clarification.

The owner inspected the overview, the featured paper, CasMD, and DL-SELEX on desktop, plus CasMD and DL-SELEX on mobile. Captures include [the desktop overview](../artifacts/archive-2026-09-08/desktop-overview.jpg), [CasMD on desktop](../artifacts/archive-2026-09-08/desktop-casmd.jpg), [DL-SELEX on desktop](../artifacts/archive-2026-09-08/desktop-dl-selex.jpg), and [CasMD on mobile](../artifacts/archive-2026-09-08/mobile-casmd.jpg). Text is printed on the selected face itself, and the HTML reader retains full source strings and actionable links. The portrait reader uses a scrollable lower overlay while leaving the selected leaf visible above it.

## Provenance and limits

The archive uses authored parametric Three.js geometry and locally generated canvas prints. It is not a Blender export, photorealistic scan, or downloaded reference-site asset. Individual prints come from the actual paper/project mapping; supporting graphic props remain authored mockups. Existing application previews are real local images. None of this establishes physical fabrication, personal possession, or a new scientific claim.

The enhanced reader depends on JavaScript and an initialized WebGL scene. On scene failure or context loss, it and inoperative controls are hidden; the eight native destination tags and site Index retain access to the complete portfolio. Reduced motion is a distinct supported state that retains selection and reading.

Headless browser tests and automated accessibility scans do not establish all-device performance, Safari coverage, or conformance certification. No production behavior is inferred from this local trial. Prior [kinetic](kinetic-verification.md) and [spatial](spatial-verification.md) receipts remain historical records; [PRODUCT.md](../PRODUCT.md) and [DESIGN.md](../DESIGN.md) define the current scope.
