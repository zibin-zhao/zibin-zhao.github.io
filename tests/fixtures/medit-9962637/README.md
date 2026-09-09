# Medit cache upgrade baseline

The two `.fixture` files are byte-for-byte copies of `public/medit/index.html` and `public/medit/sw.js` at commit `9962637`. The suffix prevents source formatters from rewriting the historical HTML and invalidating its precache revision.

`demo-cache.spec.ts` serves these two historical files with the unchanged current Medit assets, then switches to the current entry point and worker on the same isolated local origin. It exercises actual service worker installation, takeover of an existing client, offline navigation, and preservation of a draft written through the application interface.

These fixtures contain public application source, not user data.
