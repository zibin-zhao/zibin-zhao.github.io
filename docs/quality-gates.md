# Quality gates

The current Lanting prototype preserves the portfolio contract and verifies the collected-character interface. Its base evidence is in `docs/lanting-verification.md`; the added history archive is documented in `docs/past-designs.md`. Older nature and gallery receipts describe previous implementations.

| Gate          | Check                                                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Static        | `npm run verify`: formatting, lint, Astro check, unit tests, build                                                                                                                          |
| Interaction   | `npm run test:browser`: eleven insertions, thirteen reading records, exact project content, reveal, pointer proximity, focus, Escape, touch, return position, reduced motion, no JavaScript |
| Portfolio     | Fourteen routes, language continuity, filters, clipboard success and failure, exact prompt downloads, 404, and both application entry points                                                |
| Accessibility | Axe WCAG A/AA tags through WCAG 2.2; explicit keyboard checks and 320 px / 200% text reflow. Automated checks do not certify conformance.                                                   |
| Visual        | Inspect actual desktop and phone sheet, discovered piece, expanded reader, and reveal state                                                                                                 |
| Source        | Retain original image hash, artwork attribution, license metadata, and individually reviewed collected characters                                                                           |
| Font coverage | Disclose that long-form Chinese still requires a complete licensed typeface; do not relabel the fallback                                                                                    |
| Delivery      | Review this task's complete change relative to the fork snapshot; distinguish local preview from publication                                                                                |

Do not regenerate a verified CV for a homepage-only change. Production deployment, paid font acquisition, external application flows, and field performance remain separate from the local checks.

Archive checks cover the eight final design versions and local assets, consecutive footer numbering, version selection, inner routes, full-page return, language context, 320-pixel wrapper layout, and no-JavaScript navigation. Superseded viewer URLs must redirect to their family's final version. Accessibility checks cover the new viewer and current portfolio; they do not retroactively certify every historical design. Historic replays use noindex metadata and are omitted from the current portfolio sitemap.
