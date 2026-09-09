# Quality gates

The September 2026 rebuild replaces the chapter-navigation and source-layout snapshot tests. Current checks exercise the resulting public behavior.

| Gate                 | Command or observation                                                                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Declared install     | `npm ci` using the committed lockfile                                                                                                                                          |
| Static verification  | `npm run verify`: formatting, lint, Astro check, unit tests, and build                                                                                                         |
| Browser behavior     | `npm run test:browser`: desktop and mobile, both locales, no-JavaScript navigation, keyboard, filters, real clipboard and denied clipboard, downloads, 404, 320 px / 200% text |
| Accessibility        | Browser test axe scans use WCAG A/AA tags through WCAG 2.2. Automated scans do not certify conformance or replace assistive-technology testing.                                |
| Publication identity | Follow `docs/content-verification.md`; check article type, author order, DOI, and version relationships.                                                                       |
| Visual review        | Inspect actual desktop/mobile screenshots, Projects, Research, Contact, CV, and expanded prompt states.                                                                        |
| Exports              | Regenerate CV/OG from the current build, render each PDF page, verify reading order, absence of orphan headings, and file dimensions.                                          |
| Performance          | Record a named Lighthouse version and exact environment. Local lab results are not production field metrics.                                                                   |
| Demo cache change    | Test initial installation, old-client update, and offline navigation when changing a precached app entry point.                                                                |
| Dependencies         | `npm audit` and `npm audit --omit=dev`; record the check date.                                                                                                                 |
| Delivery             | Review the complete diff; disclose untested external application flows and publication status.                                                                                 |
