# Medit Vibe Card Design

## Purpose

Present the existing `/medit/` application as a real Vibe Coding project on the personal homepage. The card should make the project discoverable without embedding it or fabricating a screenshot.

## Scope

- Add one content entry to the `vibe` collection.
- Place it after Yaos and before the existing Zen placeholder through the collection order.
- Link the card to `/medit/` and retain the Vibe grid's existing external-navigation behavior.
- Use an intentional text-only preview panel rather than a generated or borrowed image.

## Card content

- Title: `Medit`
- Chinese title: `静处`
- English blurb: `A quiet, private place to write, feel, and steady yourself — journaling, gentle tools, and small daily rituals stored on your device.`
- Chinese blurb: `一个安静、私密的空间，用来书写、感受与安定自己 —— 日记、温和工具与小小的日常仪式，数据保存在你的设备上。`
- Tags: `PWA`, `Journaling`, `Meditation`, `Local-first`
- Destination: `/medit/`
- Order: `3`, shifting the existing Zen placeholder to `4` if necessary.

## Visual treatment

The project card remains an ordinary `VibeCard` so its dimensions, hover behavior, accessibility, and responsive layout stay consistent. Its no-image preview panel will be given a Medit-specific label and class hook:

- A quiet-paper panel with a small `moon / leaf / quiet place` text motif.
- Warm muted background values that distinguish it from the generic striped placeholder but do not imitate a screenshot.
- An accessible text description in the panel. No image asset is required.

## Interaction and accessibility

- The entire card remains a link that opens `/medit/` in a new tab, as the existing Vibe project cards do.
- The image-less preview includes text, so it does not rely on decorative symbols to communicate the project.
- Existing keyboard focus and reduced-motion behavior remain unchanged.

## Verification

- A collection/content test confirms the Medit entry has the intended title, URL, order, tags, and privacy-focused content.
- The existing Vibe card test is extended to confirm it accepts the Medit-specific preview variant.
- Run the full test suite and Astro production build.
- Check desktop and mobile rendering, including no horizontal overflow and a working `/medit/` link.
