# Quality-gate decisions

## ESLint accessibility coverage

This project uses ESLint 10 and `eslint-plugin-astro` for its authored Astro templates. It intentionally does not install `eslint-plugin-jsx-a11y` 6.10.2: that package declares an ESLint peer range of `^3 || ^4 || ^5 || ^6 || ^7 || ^8 || ^9`, so forcing it into the ESLint 10 dependency tree would leave the installation invalid.

The repository contains no JSX or React source. Authored Astro templates remain covered by `eslint-plugin-astro`'s recommended flat configuration. Revisit this decision if JSX is introduced or `eslint-plugin-jsx-a11y` publishes ESLint 10 support.

## Visual artifact updates

`npm run test:browser` is read-only with respect to tracked artifacts. Its screenshot exercise writes into Playwright's ignored per-test output directory so browser or compositor variation cannot dirty the worktree.

`npm run test:visual:update` intentionally refreshes the seven tracked PNGs in `artifacts/stitch`. It runs only the deterministic capture test at the canonical, desktop, and mobile viewports with `UPDATE_STITCH_ARTIFACTS=1`; review those files before committing them.

## esbuild security override

Astro delegates its development and production bundling to Vite, which previously resolved the transitive `esbuild` dependency to 0.27.7. The npm advisory database flagged that release, so the root `overrides` entry pins the complete Astro/Vite dependency graph to `esbuild` 0.28.1. Although esbuild is build-time tooling, its development and preview servers accept browser requests; a clean security audit is therefore part of the release gate rather than an accepted production-only exception.

Remove the override only after Astro and Vite's own dependency ranges resolve to an audited esbuild release at or above 0.28.1. Before removal, verify a clean install with no duplicate older esbuild, then run `npm audit`, `npm ls esbuild`, and the full `npm run verify` gate.
