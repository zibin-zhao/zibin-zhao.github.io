# Nature image sources

Retrieved and license checked on September 9, 2026. All photographs are used under the [Unsplash License](https://unsplash.com/license). These are sourced nature photographs, not personal travel photographs or generated imagery. The page credits the actual photographers.

| Local source                   | Photographer      | Source page                                                                                                                                | Use                                  |
| ------------------------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| `src/assets/nature/lake.jpg`   | Simona D'Auria    | [A foggy lake surrounded by tall grass and trees](https://unsplash.com/photos/a-foggy-lake-surrounded-by-tall-grass-and-trees-dDKjrFzijbM) | First scene and visitor postcard     |
| `src/assets/nature/forest.jpg` | Kalen Emsley      | [Body of water surrounding with trees](https://unsplash.com/photos/body-of-water-surrounding-with-trees-_LuLiJc1cdo)                       | Medit surroundings and closing scene |
| `src/assets/nature/fern.jpg`   | Jaakko Kemppainen | [Green ferns](https://unsplash.com/photos/green-ferns-k_AXt3VPSrw)                                                                         | Research close-up                    |

Only free photographs were selected; premium results were excluded. Search response records and the downloaded license page are preserved under `artifacts/nature-2026-09-09/`. The unavailable generic web-search connection was replaced by direct HTTPS retrieval through the machine's existing local proxy. No proxy configuration was changed.

Source SHA-256 hashes:

```text
1ce2b8391e340cdce4e297b6565bfeee61bc181917f22b72f71b84fb790d6c5f  lake.jpg
effb1eb0122996c2f9ffa0ece0f62147605a0594c0baf571a3f150bf64deceb1  forest.jpg
f3727a3ff2e6ed707bae8717121707905281a136e5108f9d5f6ec9061e2e842a  fern.jpg
```

Astro generates responsive local WebP derivatives. The shader distorts only the water portion at runtime; the source photograph remains underneath as a fallback. CSS crops and lenses form part of the composition. The visitor postcard includes Simona D'Auria's credit.

`src/assets/medit-preview.png` and `src/assets/singularity-preview.png` are existing application screenshots retained unchanged as historical source assets. The current homepage and Projects covers use original compositions built with the photographs above, CSS rings, SVG, and canvas stars. These covers are artwork, not screenshots of modified applications.
