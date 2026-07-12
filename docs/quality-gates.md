# Quality-gate decisions

## ESLint accessibility coverage

This project uses ESLint 10 and `eslint-plugin-astro` for its authored Astro templates. It intentionally does not install `eslint-plugin-jsx-a11y` 6.10.2: that package declares an ESLint peer range of `^3 || ^4 || ^5 || ^6 || ^7 || ^8 || ^9`, so forcing it into the ESLint 10 dependency tree would leave the installation invalid.

The repository contains no JSX or React source. Authored Astro templates remain covered by `eslint-plugin-astro`'s recommended flat configuration. Revisit this decision if JSX is introduced or `eslint-plugin-jsx-a11y` publishes ESLint 10 support.
