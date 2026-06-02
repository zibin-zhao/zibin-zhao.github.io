# Personal Webpage — Design Spec

**Owner:** Zibin Zhao
**Date:** 2026-06-02
**Status:** Approved design, pending implementation plan

---

## 1. Purpose & Audience

A **hybrid personal-brand** website for Zibin Zhao — credible to academia, legible to industry recruiters, and engaging for the ML/open-source community. One polished single page with a strong, memorable visual identity.

**Primary goals**
- Establish identity at a glance (name, field, affiliation).
- Surface research, projects, and code with direct links.
- Provide a downloadable CV and clear contact paths.
- Show range — from peer-reviewed research to playful "vibe-coded" side projects.

**Audience:** faculty/collaborators, biotech & ML recruiters, peers, the open-source community.

**Non-goals (YAGNI):** blog/CMS, news feed, comments, analytics dashboards, i18n, dark-mode toggle, server-side backend. None are in scope for v1.

---

## 2. Design Language

**Direction:** Monochrome **bold-editorial** (modeled on the user's reference: oversized outline+solid wordmark, centered portrait, pill controls), contained within a **rounded-edge frame**.

- **Palette:** near-black `#18181b`, white `#ffffff`, soft-gray page background `#e7e7e8`, muted text `#52525b`, hairline `#e4e4e7`. Single status accent: green `#22c55e` (the "Open to Collaboration" dot). No other accent color in v1.
- **Type:** Bold grotesque sans for the wordmark/headings (e.g. *Inter* / *Helvetica Neue* / *Space Grotesk* — final pick at build), weight 800, tight tracking. System sans for body.
- **Frame:** Everything sits inside rounded panels (radius ~30px) inset ~18px from the viewport edges on a soft-gray background. Generous whitespace.
- **Components:** pill buttons (status, social, CTA), hairline-bordered cards, floating rounded nav.
- **Tone:** confident, clean, a little playful in the Vibe Coding section.

---

## 3. Information Architecture

Single scrolling page, anchored nav. Section order:

1. **Hero** (full-frame landing)
2. **About**
3. **Research & Publications**
4. **Projects & Demos**
5. **Vibe Coding**
6. **CV / Resume**
7. **Contact** (dark closing section)

Nav links: About · Research · Projects · CV · Contact (+ persistent "Let's Talk" CTA → contact/email).

---

## 4. Homepage Interaction (the signature behavior)

The hero is a **framed, near-full-viewport landing** that **collapses on scroll** — never a flat all-at-once page.

**Hero composition (matches the user's annotated sketch):**
- Top bar inside the frame: status pill `● Open to Collaboration` (left), inline nav (center), `Let's Talk ↗` CTA (right).
- **Wordmark** `ZIBIN ZHAO` — "ZIBIN" outline (text-stroke), "ZHAO" solid — lifted toward the upper third.
- **Large centered portrait** rising through the gap between the two words (layered in front of the wordmark).
- **Role block** bottom-left: `Bioengineering × AI` + one-line tagline + `View research ↗`.
- **Social pills** bottom-right: GitHub · Hugging Face · Scholar · LinkedIn.
- Bobbing `scroll ↓` hint.

**Scroll behavior:**
- Hero is pinned (`position: sticky`) for ~1 viewport of scroll. As scroll progresses 0→1, the hero core **scales down, lifts, and fades**.
- Past ~55% progress a **floating rounded nav** ("ZIBIN ZHAO" logo + links + CTA) fades in and persists — the hero's "collapsed" form.
- The **content sheet** (rounded top corners) slides up beneath; sections **fade-up** on enter via `IntersectionObserver`.

**Motion level:** Tasteful & subtle (hero collapse + gentle reveals + hover states). **Must honor `prefers-reduced-motion`** — disable transforms/parallax, show content statically.

**Entrance:** on load, wordmark/portrait/role/socials rise-in with slight stagger.

---

## 5. Section Specs

### 5.1 About
Short first-person bio + focus areas. Visual: the artistic graduation poster (framed) or, if cutout succeeds, reuse the portrait.
- Bio draws on: PhD candidate, Bioengineering, HKUST (Hsing Lab); HKPFS + Redbird Award (2022); BSc Biomedical Engineering, University of Melbourne (WAM 84.6, First Class Honours).
- Focus chips: Computational biology · Deep learning · Molecular dynamics · Diagnostics.

### 5.2 Research & Publications
Reverse-chronological list; each entry: year, title, venue, links (PDF · DOI · Code · Scholar). Show metrics: **100 citations · h-index 4 · i10-index 3** (Google Scholar, badge with a "as of" date). Data-driven via content collection (§6).

**Full list (from Scholar `EQ6DTNkAAAAJ`, to seed `src/content/publications/`):**
1. 2026 — *DNA-guided CRISPR–Cas12a effectors for programmable RNA recognition and cleavage* — **Nature Biotechnology** (X Wu, WH Lam, Z Zhao, Y Cao, H Lin, X Feng, Y Zhai, IM Hsing).
2. 2026 — *Thermodynamically programmed one-pot CRISPR platform for point-of-care SNP genotyping* (IM Hsing, X Wu, Y Li, Y Cao, Z Zhao, H Lu, S Liang).
3. 2025 — *Benchtop to at-home test: Amplicon-depleted CRISPR-regulated LAMP at skin-temperature for viral load monitoring* — **Biosensors and Bioelectronics** 267.
4. 2025 — *Structure-enhanced deep learning accelerates aptamer selection for small-molecule families like steroids* — **Briefings in Bioinformatics** 26(6). *(DL-SELEX)*
5. 2025 — *DNA-guided CRISPR/Cas effector for programmable RNA-recognition and cleavage* (IM Hsing, X Wu, Z Zhao, Y Cao, H Lin, X Feng).
6. 2025 — *DNA hydrogel-interfaced organic electrochemical transistor for binding-induced conformational change of small-molecule aptamers* — **ACS Applied Materials & Interfaces** 17(37).
7. 2023 — *Skin-adherent elastomer-hydrogel patch for continuous 12-lead cardiac ambulatory monitoring during physical activities* — **Advanced Materials Technologies** 8(18).
8. 2023 — *Integrating magnetic-bead sample extraction and molecular barcoding for one-step pooled RT-qPCR of viral pathogens* — **Analytical Chemistry** 95(14).
9. 2023 — *Transforming ECG diagnosis: a review of transformer-based deep-learning models in cardiovascular disease detection* — **arXiv:2306.01249**. *(most-cited: 37)*

> Implementation note: verify each entry's DOI/link at build; mark first-author papers; optionally tag "featured" (e.g. Nature Biotech, DL-SELEX, ECG review). Keep TEMPO/DL-SELEX code links to GitHub.

### 5.3 Projects & Demos
Cards with tag + title + blurb + link:
- **HsingMD** — live Hugging Face Space (protein–nucleic acid MD). Link: huggingface.co/spaces/CasMD/HsingMD.
- **DL-SELEX** — github.com/zibin-zhao/DL-SELEX.
- **TEMPO** — github.com/zibin-zhao/TEMPO.
- **ECG App / CasMD** — ECG analysis app & protein toolkit.

### 5.4 Vibe Coding (new)
Playful, extensible gallery of AI-pair-programmed side projects. Section heading "Built for the joy of it". Cards have a **screenshot slot left blank for now** (placeholder), title (EN + 中文 subtitle), blurb, tags, link. Grid is **data-driven and extensible** — adding/reordering a project = editing one content entry; includes an "open slot / more to come" affordance.
- **Yaos** (药师法门 · 养生 — Medicine Buddha Wellness): installable **PWA** that auto-detects current 时辰 & 节气 for personalized health-cultivation advice, with readings + calendar. Tags: PWA · HTML/JS · Wellness · Claude Code.
- **Zen** (禅德 / Zende): **WeChat Mini Program** (uni-app/Vue + WeChat Cloud) for meditation & mindfulness — guided sessions, journaling, streaks, virtual pet, Buddhist calendar. Tags: uni-app/Vue · WeChat · Cloud DB · Claude Code.

> **Not yet public:** neither project is deployed/published, so cards have **no live links for v1** — show them with a "private / coming soon" state (no broken hrefs) and blank screenshot slots. Links + screenshots get filled in when the user publishes.

### 5.5 CV / Resume
Two-column: timeline (left) + summary & **PDF download** (right).
- Timeline seed: PhD HKUST (2022–present, HKPFS·Redbird); BSc Melbourne (2018–2020, First Class Honours); Research Asst. HKUST (wearable 12-lead ECG); experience incl. PealthMed Ltd.
- Skills: Python, C, MATLAB, LabVIEW, SolidWorks. Languages: Mandarin/Cantonese (native), English (professional).
- **PDF — generate a new, updated CV** as a build deliverable: take the 2022 CV (`Zibin_CV_ENG_2022.pdf`) as the base and **merge in current publications (§5.2) and works** (TEMPO, DL-SELEX, HsingMD, PealthMed). Output `public/cv.pdf`, matching the site's clean monochrome typography. The on-page timeline and the PDF share one source of truth (`src/data/cv.ts`).

### 5.6 Contact (dark closing)
Inverted near-black section: "Let's talk." + links row: Email (`zibin.zhao@connect.ust.hk`) · GitHub · Hugging Face · Scholar · LinkedIn · ORCID. Footer with copyright. No contact form in v1 (static host).

---

## 6. Content Model (Astro content collections)

Keep content in editable data files so the site is maintainable without touching layout:

- `src/content/publications/*.md` — frontmatter: `title, authors, venue, year, links{pdf,doi,code,scholar}, featured`.
- `src/content/projects/*.md` — `title, blurb, tags[], href, repo, type`.
- `src/content/vibe/*.md` — `title, titleZh, blurb, tags[], href, screenshot, order`.
- `src/data/profile.ts` — name, tagline, role, socials, email, status text.
- `src/data/cv.ts` (or markdown) — timeline entries, skills, pdf path.

Rationale: one focused unit per concern; adding a publication or project is a one-file edit; layout components stay generic.

---

## 7. Tech Stack & Structure

- **Framework:** **Astro** (static output; ships ~zero JS except the small hero-scroll + reveal scripts as an island/inline script).
- **Styling:** scoped component CSS (or a tokens file). No heavy UI framework.
- **JS:** minimal vanilla for scroll-collapse + `IntersectionObserver`; `prefers-reduced-motion` guard.
- **Proposed structure:**
  ```
  src/
    components/  Hero.astro  Nav.astro  Section.astro  PubList.astro
                 ProjectCard.astro  VibeCard.astro  CvTimeline.astro  Contact.astro
    content/     publications/  projects/  vibe/
    data/        profile.ts  cv.ts
    layouts/     Base.astro
    pages/       index.astro
    styles/      tokens.css  global.css
  public/        portrait.png  poster.png  cv.pdf  screenshots/
  ```

---

## 8. Assets & Portrait Handling

- **Portrait:** attempt background removal on `headshot.png` (the artistic poster) at build (e.g. `rembg`). **Risk:** the silhouette blends into campus imagery + baked-in "GRADUATE" text, so an automated cutout may not be clean. **Fallback:** present the poster framed beside the wordmark instead of as a transparent cutout. Decision made when we see the result.
- **Poster:** reusable in About if not used in hero.
- **Vibe screenshots:** placeholders now; real images dropped into `public/screenshots/` later.
- **Favicon/OG:** simple monogram + OG image for link previews.

---

## 9. Accessibility & Performance

- Semantic landmarks, single `<h1>` (the wordmark/name), labeled nav, focus-visible states, alt text on images.
- Color contrast AA (monochrome palette passes easily; verify muted-gray text sizes).
- `prefers-reduced-motion` fully supported.
- Lighthouse target ≥95 across the board; lazy-load images; system/self-hosted fonts (avoid layout shift).
- Responsive: wordmark scales with `clamp()`; on mobile the hero recomposes (portrait centered, role/socials stack); pill nav collapses to a compact menu.

---

## 10. Deployment

- **Host:** **GitHub Pages** from repo `zibin-zhao/<repo>` via GitHub Actions (`withastro/action` → deploy to Pages).
- **Custom domain (confirmed): `zibinzhao.com`.** Set Astro `site: 'https://zibinzhao.com'` (no `base` needed with apex domain). Add `public/CNAME` containing `zibinzhao.com`; configure DNS (A/ALIAS records to GitHub Pages + `www` CNAME) and enable HTTPS in repo settings. `[ACTION]` user registers/points the domain; site works on `*.github.io` until DNS resolves.
- CI: build on push to `main`; deploy artifact to Pages via GitHub Actions.

---

## 11. Decisions & Remaining Actions

**Resolved (2026-06-02):**
1. ✅ Publications — **full list** (all 9, §5.2), with Scholar metrics.
2. ✅ Vibe Coding — **not public yet**; no live links/screenshots for v1 (show "coming soon"). User adds later.
3. ✅ CV — **generate a new updated CV** merging current publications + works; the 2022 PDF is the base (§5.5).
4. ✅ Domain — **custom `zibinzhao.com`** (§10).
5. ✅ Role/tagline — **keep "Bioengineering × AI"**.
6. ✅ Canonical GitHub — `zibin-zhao` (HF-linked `bennyzhao99` 404s; ignore).

**Remaining user actions (don't block the build):**
- Register/point DNS for `zibinzhao.com` to GitHub Pages.
- Provide portrait outcome feedback once cutout is attempted.
- Supply Yaos/Zen screenshots + links when published.
- Review/approve the auto-generated CV before publishing it.

---

## 12. Success Criteria

- Loads as a framed, full-screen hero that collapses smoothly on scroll into a floating nav.
- All five content sections present, populated from editable content files, with working external links.
- CV downloads; contact links work; portrait resolved (cutout or framed fallback).
- Responsive + accessible (reduced-motion honored), Lighthouse ≥95.
- Deploys to GitHub Pages on push.
