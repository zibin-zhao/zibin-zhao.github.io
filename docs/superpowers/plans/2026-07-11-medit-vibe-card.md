# Medit Vibe Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the existing `/medit/` app as a genuine, discoverable Vibe Coding project card on the homepage.

**Architecture:** The Astro content collection remains the source of truth for Vibe cards. A new `medit.md` entry supplies the project copy, tag set, route, and a `preview` identifier; `VibeCard.astro` interprets that identifier to render a text-only Medit preview without creating a false screenshot.

**Tech Stack:** Astro content collections, Astro components, CSS, Vitest.

## Global Constraints

- Link the card to `/medit/` and retain the existing new-tab behavior for Vibe cards.
- Use no generated, borrowed, or fabricated screenshot.
- Keep the English and Chinese copy exactly as approved in the design spec.
- Preserve the existing responsive Vibe grid and existing placeholder behavior for projects without a screenshot.

---

### Task 1: Add the Medit content contract and preview variant

**Files:**
- Modify: `src/content.config.ts:19-22`
- Create: `src/content/vibe/medit.md`
- Modify: `src/content/vibe/zen.md:1-10`
- Modify: `src/components/VibeCard.astro:1-21`
- Modify: `tests/collage-foundation.test.ts:47-57`

**Interfaces:**
- Consumes: The `vibe` collection data loaded by `src/components/Vibe.astro`.
- Produces: `preview?: 'medit'` on Vibe content entries and a `.shot--medit` text-only preview rendered by `VibeCard.astro`.

- [ ] **Step 1: Write the failing content and component test**

Add this test after the existing Vibe placeholder test:

```ts
  it('defines Medit as a real local-first Vibe project', () => {
    const medit = read('src/content/vibe/medit.md');
    const zen = read('src/content/vibe/zen.md');
    const vibeCard = read('src/components/VibeCard.astro');

    expect(medit).toContain('title: "Medit"');
    expect(medit).toContain('href: "/medit/"');
    expect(medit).toContain('preview: "medit"');
    expect(medit).toContain('tags: ["PWA", "Journaling", "Meditation", "Local-first"]');
    expect(medit).toContain('stored on your device');
    expect(zen).toContain('order: 4');
    expect(vibeCard).toContain("preview === 'medit'");
    expect(vibeCard).toContain('shot--medit');
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/collage-foundation.test.ts`

Expected: FAIL because `src/content/vibe/medit.md` does not exist and the `preview` variant is absent.

- [ ] **Step 3: Implement the smallest content schema and card changes**

Extend the Vibe collection schema with the optional preview field:

```ts
const vibe = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/vibe' }),
  schema: z.object({ title: z.string(), titleZh: z.string().optional(), blurb: z.string(), blurbZh: z.string().optional(), tags: z.array(z.string()).default([]), href: z.string().optional(), screenshot: z.string().optional(), preview: z.enum(['medit']).optional(), comingSoon: z.boolean().default(false), order: z.number().default(0) }),
});
```

Create `src/content/vibe/medit.md` with this frontmatter:

```md
---
title: "Medit"
titleZh: "静处"
blurb: "A quiet, private place to write, feel, and steady yourself — journaling, gentle tools, and small daily rituals stored on your device."
blurbZh: "一个安静、私密的空间，用来书写、感受与安定自己 —— 日记、温和工具与小小的日常仪式，数据保存在你的设备上。"
tags: ["PWA", "Journaling", "Meditation", "Local-first"]
href: "/medit/"
preview: "medit"
order: 3
---
```

Change `src/content/vibe/zen.md` to `order: 4`.

Change the VibeCard props and preview markup to:

```astro
const { title, titleZh, blurb, blurbZh, tags = [], href, screenshot, preview, comingSoon } = Astro.props;
---
  <div class:list={['shot', preview && `shot--${preview}`]}>
    {screenshot ? <img src={screenshot} alt={`${title} screenshot`} width="800" height="600" loading="lazy" /> : preview === 'medit' ? <span class="medit-preview" aria-label="Medit: a quiet place for journaling and gentle daily rituals">☾ &nbsp; leaf / quiet place &nbsp; ☾</span> : <T en="Image / experiment holder — awaiting an original screenshot" zh="图像 / 实验占位区 —— 等待原创截图" />}
  </div>
```

Add these scoped styles:

```css
  .shot--medit{background:linear-gradient(145deg,#e8dec4,#f7f0de);color:#6b5730}
  .medit-preview{border:1px solid currentColor;padding:10px 12px;font:700 10px/1 var(--font-note);letter-spacing:.08em;text-transform:uppercase;transform:rotate(-2deg)}
```

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `npm test -- tests/collage-foundation.test.ts`

Expected: PASS with all collage foundation assertions green.

- [ ] **Step 5: Run the complete verification suite**

Run: `npm test && npm run build && git diff --check`

Expected: all Vitest files pass, Astro builds `/` and `/prompts/`, and `git diff --check` emits no output.

- [ ] **Step 6: Commit and publish**

Run:

```bash
git add src/content.config.ts src/content/vibe/medit.md src/content/vibe/zen.md src/components/VibeCard.astro tests/collage-foundation.test.ts docs/superpowers/plans/2026-07-11-medit-vibe-card.md
git commit -m "feat: add Medit to vibe projects"
git push origin main
```

Expected: `main` is synchronized with `origin/main`; the site deployment receives the new Vibe card.
