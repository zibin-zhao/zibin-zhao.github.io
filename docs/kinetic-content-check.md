# Kinetic hero: content and interaction contract

Audit date: September 8, 2026. Scope: the approved local upgrade from an equally weighted field of objects to a crafted 3D hero with supporting objects. This document records preservation requirements and test adaptation guidance. It does not change website or test implementation, authorize deployment, or report a browser-test pass.

## Comparison baseline

Use [baseline-manifest.json](../artifacts/kinetic-2026-09-08/baseline-manifest.json) and the [before snapshot](../artifacts/kinetic-2026-09-08/before/) as the comparison source. The capture completed at `2026-09-08 07:47:57 +08:00`. It contains the actual working-tree bytes, including the existing uncommitted rebuild; Git HEAD is recorded only for orientation.

The manifest records SHA-256 and byte length for 73 files. It retains 54 copies under `before/`, including the scene, Home, components, layouts, styles, data, publications, routes, tests, export utility, configuration, product/design documents, and CV PDF. Nineteen larger or supporting resources are recorded by hash without a second copy. All 54 copied files matched their captured hashes immediately after copying.

| Protected group                             | Files |     Bytes | Preservation check                                              |
| ------------------------------------------- | ----: | --------: | --------------------------------------------------------------- |
| Factual source data and publication content |    13 |    21,232 | Exact bytes unless a separate factual edit is explicitly scoped |
| Medit public bundle                         |    11 | 4,217,152 | Exact file set and bytes                                        |
| Singularity public bundle                   |     3 |   505,644 | Exact file set and bytes                                        |
| Public CV PDF                               |     1 |   155,034 | Exact bytes; no regeneration for a hero-only change             |

The baseline SHA-256 of `public/cv.pdf` is `66aa7a02491a8d96a28ce3439be895ba6e7a946500f2eb38b3b2d95006927a2e`. The manifest includes individual hashes and deterministic group-ledger hashes. Hash preservation confirms unchanged inputs, not independent verification of scientific or biographical claims.

Audit validation: the comparison command below was executed once after documenting the baseline. All 28 protected files matched; no additions, removals, or byte changes were found. No build or browser tests were run by this audit branch.

## Content and route invariants

The visual hierarchy may change. Eight routes from the homepage must remain easy to reach: Research, Projects, Singularity, Medit, About, Prompts, CV, and Contact. They do not require eight equally prominent meshes or eight floating captions in the opening shot.

| Destination             | English         | Chinese               |
| ----------------------- | --------------- | --------------------- |
| Home                    | `/`             | `/zh/`                |
| Research                | `/research/`    | `/zh/research/`       |
| Projects                | `/projects/`    | `/zh/projects/`       |
| About                   | `/about/`       | `/zh/about/`          |
| CV                      | `/cv/`          | `/zh/cv/`             |
| Contact                 | `/contact/`     | `/zh/contact/`        |
| Prompts                 | `/prompts/`     | `/zh/prompts/`        |
| Medit application       | `/medit/`       | Same application path |
| Singularity application | `/singularity/` | Same application path |

Preserve fourteen portfolio URLs in the sitemap; the two public applications are separate entries outside that portfolio count. Keep `/night/` and `/zh/night/` removed. Preserve the existing 404 recovery, one visible H1 per page, canonical URLs, three language-alternate links, locale-specific HTML language, and meaningful page descriptions. The language switch must target the same page in the other locale.

Keep six project identities: `casmd`, `dlselex`, `medit`, `tempo`, `singularity`, and `yaos`. Their factual descriptions, contributions, repositories, papers, and application destinations remain unchanged. Projects filtering still returns 2 everyday tools, 3 research projects, and 6 total entries.

Keep seven journal records plus one standalone preprint. Preserve titles, author attribution, DOI/source links, the earlier-preprint relationship, and the author-correction link. Keep eight prompt stages with eleven exact English bodies, the text download, and copy recovery. Preserve CV content, education entries, `zibin.zhao@connect.ust.hk`, and the five professional-profile links. A new sculpture must not imply a new scientific result, institutional role, or product capability.

## Stable DOM and reading behavior

| Surface           | Existing selectors / attributes                                                                                      | Required behavior                                                                       |
| ----------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Scene             | `.spatial-home [data-gallery-scene]`, `.gallery-canvas`, `[data-scene-fallback]`                                     | Real rendered scene or an explicit readable fallback                                    |
| Home destinations | `a[data-spatial-anchor]`, values `research`, `projects`, `singularity`, `medit`, `about`, `prompts`, `cv`, `contact` | Meaningful native links, usable without WebGL or JavaScript                             |
| Index             | `.mobile-menu`, its `summary`, `.mobile-menu nav`                                                                    | Native disclosure at every width; Enter opens, Escape closes and restores summary focus |
| Locale            | `.language-link`                                                                                                     | Preserve current destination while switching language                                   |
| Keyboard entry    | `.skip-link`, `main#main[tabindex="-1"]`                                                                             | First Tab reaches the skip link; activating it focuses main                             |
| Reading sheets    | `.reading-sheet`, `.sheet-close`, `.site-footer`                                                                     | Ordinary scrolling, return to Home in the current locale, reachable footer navigation   |
| Research fragment | `#research`, `#research-title`                                                                                       | `/#research` remains a usable native destination even with reduced motion               |
| Projects          | `.project-card`, `data-category`, `#project-results`, `#filter-status`                                               | Correct filtering, hidden entries truly hidden, result announcement                     |
| Prompts           | `#step-N`, `.prompt-toc`, `.prompt-text`, `[data-copy-target]`                                                       | Native details, hash opening, exact copy text, manual failure recovery                  |

Keeping these hooks is the least disruptive option. A deliberate hook rename is possible, but update every actual consumer, including the export utility and relevant tests. Do not keep dummy offscreen links or attributes solely to satisfy assertions.

At 320 px and 200% text size, preserve readable content and access to all destinations. Current tests check horizontal overflow and footer reachability; they do not establish the absence of overlapping labels. Inspect overlap and scene occlusion separately. The canvas remains decorative to assistive technology, with `aria-hidden="true"`; the reading layer must not depend on a completed intro animation, hidden text becoming visible, or a raycast.

## Motion, rendering, and fallback invariants

- `data-state="ready"` follows an actual successful render. `loading` must not remain indefinitely. WebGL creation failure, renderer failure, or context loss goes to `fallback`, reveals the fallback artwork, hides the canvas, and hides inoperative scene controls while retaining HTML links.
- The current controls are `[data-gallery-motion]`, `[data-gallery-shuffle]`, and `[data-gallery-reset]`. Paused state has `data-motion="paused"`, `aria-pressed="true"`, and the localized action label “Play motion” or “开启动效”. Running state offers “Pause motion” or “暂停动效”. Preserve action semantics if visual labels change.
- Reduced motion starts with a still rendered composition and continues to honor preference changes. An opening camera sequence must not override that preference. User-requested changes can render a new still frame; they must not silently restart continuous motion.
- Pause must stop actual continuous draws after bounded settling, including animation owned by any newly imported model. Keep a single coordinated render lifecycle. Suspend continuous rendering when hidden or offscreen; abort listeners, observers, animation callbacks, materials, geometry, and owned textures on disposal.
- Retain tap/click navigation and distinguish it from drag. Current canvas interactions use `touch-action: pan-y`, horizontal touch dragging, and click-versus-drag distance thresholds. Vertical touch movement must still allow page scrolling; dragging must not accidentally open an artifact link.
- Resizing must update projection and renderer dimensions. The baseline uses adaptive device pixel ratio, including software-renderer reductions. A canvas drawing buffer may be smaller than its CSS size; require a valid positive buffer, not intrinsic pixel equality. The existing 1200 by 630 OG export follows that rule.
- Interior routes share the same scene implementation. Keep their reading sheets, motion control, viewport behavior, and fallback usable even though the homepage now has a different visual hierarchy.

## Existing tests: keep behavior, adapt composition assumptions

The baseline contains 7 unit tests and 35 logical browser cases: 24 in `site.spec.ts`, plus 11 in `gallery.spec.ts` after locale expansion. Playwright runs the browser cases in desktop and mobile projects, yielding 70 cases. This is a source audit of test definitions, not execution evidence.

| Existing assertion                                                                                                 | Relationship to the approved upgrade                                 | Appropriate treatment                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gallery helper selects `[data-layout="field"]`; first test expects `data-mode="field"`                             | Internal naming describes the previous composition                   | Keep the hooks or update selectors and naming if the implementation deliberately changes them. Do not weaken render/fallback checks.                                                                                                     |
| Eight `a[data-spatial-anchor]` links and their exact destinations                                                  | Protects content, not equal mesh size                                | Preserve eight real destinations. If navigation moves into a different explicit structure, update the structural selector while retaining destination, name, no-JS, and fallback coverage.                                               |
| Every desktop link has `data-projected="true"` and is fully in the initial viewport                                | Assumes every destination is a floating caption in the opening field | Adapt only if the new design uses fixed supporting navigation or a focused opening shot. Verify actual projected captions where used, and reachability of all other destinations without requiring a camera tour.                        |
| Shuffle moves at least one caption by more than 8 px; reset returns all captions within 6 px                       | Uses HTML label movement as a proxy for scene movement               | If labels become fixed, measure an actual projected mesh point or scene/camera transform and real rendering. Reset must restore the intended starting view, with reduced motion still paused. Do not substitute a state attribute alone. |
| Canvas click targets desktop `about` and mobile `singularity` via `data-object-x/y`                                | These specific mesh points were exposed in the old composition       | Update the chosen exposed mesh and its true projected point if the hero occludes them. Preserve the `elementFromPoint(...) === canvas` check and verify navigation through a real raycast.                                               |
| Drag expects the same chosen point's X coordinate to change                                                        | An object at the camera or rotation pivot may keep its center fixed  | Choose an off-pivot point or a meaningful rendered transform. Preserve actual input, drawing, no link activation, unchanged URL, and paused state.                                                                                       |
| Instrumentation counts `WebGL2RenderingContext.drawElements`                                                       | Valid for the existing indexed meshes                                | Keep it if the new model uses indexed drawing. If geometry changes to other draw paths, count those real paths too; do not replace rendering evidence with `data-state`.                                                                 |
| Ready/fallback distinction, positive drawing buffer, real draw activity, pause/resume, live reduced-motion changes | Behavioral requirements independent of art direction                 | Retain. The helper independently probes WebGL2 support, so a broken renderer on a supported machine must fail instead of being accepted as fallback coverage.                                                                            |
| All `site.spec.ts` content, navigation, clipboard, metadata, reflow, downloads, and 404 checks                     | Unrelated to replacing equal objects with a hero                     | Preserve their intent and expected content. Fix regressions instead of loosening these checks.                                                                                                                                           |

Existing browser tests explicitly cover unavailable WebGL, but do not currently prove context-loss recovery, hidden-tab suspension, offscreen suspension, or an opening camera sequence's completion. Those are meaningful targeted checks if this upgrade changes the corresponding lifecycle. The scene's quality also requires actual desktop/mobile visual review; passing route and draw tests does not prove a successful opening composition.

## Comparing protected content at delivery

From the repository root, this read-only check compares the protected file sets and bytes with the captured working tree:

```sh
python3 - <<'PY'
from pathlib import Path
import hashlib, json

root = Path.cwd()
manifest = json.loads((root / 'artifacts/kinetic-2026-09-08/baseline-manifest.json').read_text())
protected = {'factual_sources', 'medit_bundle', 'singularity_bundle', 'cv_pdf'}
expected = {item['path']: item['sha256'] for item in manifest['files'] if item['group'] in protected}
actual = {'public/cv.pdf'}
for directory in ['src/data', 'src/content', 'public/medit', 'public/singularity']:
    actual.update(path.relative_to(root).as_posix() for path in (root / directory).rglob('*') if path.is_file())
changed = [name for name in sorted(actual & expected.keys())
           if not (root / name).is_file()
           or hashlib.sha256((root / name).read_bytes()).hexdigest() != expected[name]]
result = {'added': sorted(actual - expected.keys()),
          'removed': sorted(expected.keys() - actual),
          'changed': changed}
print(json.dumps(result, indent=2))
raise SystemExit(any(result.values()))
PY
```

Review implementation changes against `before/`, not against a pristine Git checkout. Keep the baseline immutable. Record current build/test results separately, along with any intentionally changed exports or presentation files. No production push, merge, or deployment was performed by this audit branch.
