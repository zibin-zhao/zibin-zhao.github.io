# Quality gates

The current direction is defined in PRODUCT.md and DESIGN.md. Verification applies to the manuscript discovery interface and the retained portfolio contracts.

| Gate          | Check                                                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Static        | `npm run verify`: formatting, lint, Astro check, unit tests, and build                                                                |
| Arrival       | Full viewport manuscript and exactly one Highlight button; no exposed navigation, footer, hints, counters, or index                   |
| Discovery     | Twelve original-word entry points, thirteen reading records, proximity, hover, keyboard focus, touch, and exact content               |
| Highlight     | One sourced 一觀 control; dark ink and reversible veil, individual labels, concealed 昔 history glyph, eight editions, restored focus |
| Reading       | Contents, previous/next, close, Escape, browser Back/Forward, direct reading URLs, and preserved source position                      |
| Typography    | One reading stack across current pages; supporting text at least 14 px at default size; normal Chinese tracking                       |
| Portfolio     | Fourteen routes, language continuity, filters, clipboard success/failure, exact prompt downloads, 404, and application entry points   |
| Accessibility | Axe WCAG A/AA tags through WCAG 2.2, explicit keyboard checks, reduced motion, no JavaScript, and 320 px / 200% text reflow           |
| Visual        | Inspect desktop and phone manuscript, highlighted labels, Past versions, proximity feedback, opened leaf, Contents, and inner pages   |
| Source        | Exact image hash, unchanged base image, aligned Highlight ink, centered hover enlargement, and restored pixels after interaction      |
| Delivery      | Review the complete task diff from production baseline `92745b6`; distinguish local preview from publication                          |

Run `npm run test:browser` against the built site. It covers desktop Chromium, phone Chromium, and the manuscript and archive contracts in phone WebKit. Mouse-wheel checks apply to desktop, while phones have explicit touch journeys. Automated accessibility checks are evidence for tested states, not certification.

The existing archive checks preserve destination loading, numbering, redirects, language context, local assets, and return paths. They do not change or recertify historical designs.

Keep the verified CV PDF and embedded application bundles unchanged. No font purchase or new credential is required. Deployment and live-site verification are separate actions.
