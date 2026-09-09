# Nine archive leaves

The interactive archive uses real existing portfolio records. `src/lib/archive-content.ts` exports `ArchiveLeaf` and `buildArchiveLeaves(lang, publications)`. The caller supplies the publication collection; the builder reads the canonical project array directly. It returns nine entries in this order:

| Leaf | ID                      | Source                               |
| ---- | ----------------------- | ------------------------------------ |
| 1    | `nature-biotech-cas12a` | Nature Biotechnology publication     |
| 2    | `casmd`                 | CasMD project                        |
| 3    | `dlselex`               | DL-SELEX project                     |
| 4    | `medit`                 | Medit project                        |
| 5    | `tempo`                 | TEMPO project                        |
| 6    | `singularity`           | Singularity project                  |
| 7    | `yaos`                  | Yaos project                         |
| 8    | `ecg-patch-12lead`      | 12-lead monitoring patch publication |
| 9    | `dna-hydrogel-oect`     | DNA hydrogel/OECT publication        |

Projects retain their canonical array order, name, localized type, summary, contribution, primary action, and available source/paper links from `src/data/projects.ts`. No project copy or URL is duplicated in this module.

For each publication, `title` is a concise bilingual surface label, `kicker` combines the exact venue and year, `summary` is the exact full English title, and `detail` is the exact author string from its collection entry. English titles and author strings remain unchanged in both locales. Links preserve the actual DOI and any earlier-preprint or author-correction URL; the featured Cas12a leaf retains all three. The module does not generate a scientific summary or claim a new contribution.

The builder throws if a required publication is missing or the canonical project count is no longer six. A content change that affects the nine-leaf mapping therefore requires an explicit mapping update rather than silently omitting a leaf. It performs no network requests and does not mutate source records. The scene and reading interface own selection, focus, navigation, and open/close behavior.
