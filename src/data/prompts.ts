// Content for the /prompts page. Prompt TEXT is reproduced verbatim from the
// source pack and must stay in English (these are literal copy-paste prompts).
// Only the page chrome is bilingual (handled in the page via <T/>).

export type PromptBlock = { label?: string; text: string };
export type Stage = {
  num: string;
  title: string;
  tool: string;
  frontier?: boolean;
  note?: string;
  blocks: PromptBlock[];
  afterNote?: string;
};

export const promptPack = {
  kicker: 'Prompt Pack',
  title: 'Writing any Review Articles with AI',
  intro:
    'A worked, copy-paste companion to the AI Review-Article Pipeline. Every prompt below is filled in for one running example — a review of molecular dynamics (MD) simulations of CRISPR-Cas effector complexes — so you can see exactly what a real prompt looks like. Swap the parts in [BRACKETS] to reuse any of them for your own topic.',
  runningExample:
    'Molecular dynamics simulations of CRISPR-Cas effector complexes: conformational mechanisms and methodological advances (2018–2026).',
  howToUse:
    "Paste each prompt into the tool named in its heading, at the matching pipeline stage. Prompts marked (frontier LLM) go to Claude, ChatGPT, or Gemini. The anti-hallucination guardrails are baked in — don't strip them out.",

  stages: [
    {
      num: '0',
      title: 'Sharpen the scope',
      tool: 'frontier LLM',
      frontier: true,
      blocks: [
        {
          text: `I'm planning a review article and want to sharpen its scope before I start searching.

Working topic: molecular dynamics (MD) simulations of CRISPR-Cas effector
complexes, focused on what they reveal about conformational mechanisms —
target recognition, R-loop formation, conformational gating, and cleavage
activation.

Help me by:
1. Proposing 3 candidate research questions at different scope levels
   (broad / focused / narrow), each phrased as a single answerable question.
2. For the focused option, drafting explicit inclusion and exclusion criteria:
   date range, simulation types to include (classical all-atom, enhanced
   sampling, QM/MM, coarse-grained), which Cas families are in vs out of scope,
   and what counts as in-scope vs merely adjacent.
3. Listing 4–6 sub-themes a thorough review of this question must cover.

Ask me clarifying questions first if anything about the scope is ambiguous.`,
        },
      ],
    },
    {
      num: '1',
      title: 'Orientation',
      tool: 'Perplexity · Academic Focus + Deep Research',
      note:
        'Turn on Academic Focus and run it in Deep Research mode. Treat the output as a map, not a draft — click and verify the sources it cites.',
      blocks: [
        {
          text: `Act as a research analyst. Give me a structured, cited overview of the use of
molecular dynamics simulations to study CRISPR-Cas effector complexes from
2018 to 2026.

Cover:
- Which Cas systems MD has been applied to (Cas9, Cas12 family, Cas13, etc.)
  and what mechanistic questions each line of work addressed
- The dominant simulation approaches — classical all-atom MD, enhanced sampling
  (metadynamics, umbrella sampling, replica exchange), QM/MM, coarse-grained —
  and the force fields used for protein–nucleic acid complexes
- Landmark papers and their most-cited findings
- Open questions and known methodological limitations

For every claim, cite a peer-reviewed source with a working link. Explicitly
flag where the evidence is thin, preliminary, or contested.`,
        },
      ],
    },
    {
      num: '2',
      title: 'Search & screen',
      tool: 'Elicit',
      blocks: [
        {
          label: "Search question — paste into Elicit's main query box",
          text: `What do molecular dynamics simulations reveal about the conformational
mechanisms of CRISPR-Cas effector complexes during target recognition,
R-loop formation, and cleavage?`,
        },
        {
          label: 'Screening criteria — apply while reviewing the result list',
          text: `INCLUDE: peer-reviewed primary studies, 2018–2026, that run MD (any flavor)
on a CRISPR-Cas effector–nucleic acid complex and report a conformational or
mechanistic result.

EXCLUDE: pure experimental papers with no simulation; docking-only or static
structure-prediction papers with no dynamics; reviews; Cas systems outside
[your chosen families]; simulations under [e.g., 50 ns] with no enhanced
sampling.`,
        },
      ],
    },
    {
      num: '3',
      title: 'Extraction',
      tool: 'Elicit columns · SciSpace · Scite',
      blocks: [
        {
          label: 'Elicit custom columns — add these so the corpus drops into a comparable grid',
          text: `- Cas effector studied
- Simulation method + force field
- Timescale (ns/µs) and system size (atoms)
- Enhanced sampling used? (which)
- Key conformational finding
- Validated against experiment? (how)
- Stated limitations`,
        },
        {
          label: 'Per-paper deep read — paste into SciSpace / any chat-with-PDF tool with the paper open',
          text: `Summarize this paper's MD methodology in 5 bullets: system built, force field,
solvation and ions, ensemble + timescale, and enhanced-sampling method (if any).
Then state the single main conformational conclusion, and quote the specific
result — with its numbers — that supports it.

Do not infer beyond the text. If a detail isn't stated, write "not reported."`,
        },
        {
          label: 'Reception check — paste into Scite for any finding you plan to lean on',
          text: `Has the finding that [e.g., "the REC2 domain gates HNH activation in Cas9"]
been supported, mentioned, or contradicted by later studies?`,
        },
      ],
    },
    {
      num: '5',
      title: 'Synthesis & outline',
      tool: 'frontier LLM',
      frontier: true,
      note:
        'Feed it your finished extraction table. This is where you decide the argument — the model only organizes.',
      blocks: [
        {
          text: `Below is my extraction table from [N] papers on MD simulations of CRISPR-Cas
complexes.

[PASTE TABLE]

Using ONLY the information in this table:
1. Group the papers into 4–6 coherent themes and name each theme.
2. For each theme, state the consensus finding and note any disagreements
   between papers.
3. Identify 2–3 genuine gaps the table reveals — questions that none of these
   papers answer.
4. Propose a section-by-section outline for a review built around these themes.
   Under each section, list which papers (first author + year) support it.

Do not add any paper, fact, or citation that is not in the table. If something
is missing, say so rather than filling it in.`,
        },
      ],
    },
    {
      num: '6',
      title: 'Draft one section',
      tool: 'frontier LLM · sources-only',
      frontier: true,
      note: 'Draft section by section. Paste in only the verified sources for that section.',
      blocks: [
        {
          text: `Draft the "[SECTION NAME — e.g., Enhanced-sampling approaches to R-loop
formation]" section of my review. Target ~[600] words.

Rules:
- Use ONLY the sources pasted below. Introduce no other papers, facts, or
  citations.
- Cite as [Author, Year], matching the provided sources exactly.
- Preserve every number, unit, and statistical value exactly as written —
  never round, rephrase, or "improve" them.
- Where sources disagree, present the disagreement; do not smooth it over.
- Academic register. No filler, no "in conclusion."

Sources:
[PASTE each verified paper or your notes, tagged with Author + Year]`,
        },
      ],
    },
    {
      num: '7',
      title: 'Build a verification checklist',
      tool: 'frontier LLM',
      frontier: true,
      note:
        "The model can't verify citations — it just extracts them so you can check each one by hand.",
      blocks: [
        {
          text: `Here is a section of my review draft. Extract every factual or numerical claim
and the [Author, Year] it is attributed to. Output a table with columns:
Claim | Cited source | Verified? (leave this column blank for me).

Do NOT judge whether any citation is correct — you cannot verify sources. Only
pull out the claims and their attributed sources so I can check each manually.

[PASTE draft section]`,
        },
      ],
      afterNote: 'Then open every DOI yourself and fill the "Verified?" column.',
    },
    {
      num: '8',
      title: 'Academic line edit',
      tool: 'frontier LLM · or Writefull / Paperpal',
      frontier: true,
      blocks: [
        {
          text: `Line-edit the following for academic journal register. Tighten wordiness, fix
grammar, and sharpen vague phrasing (e.g., replace bare "significant" with the
specific statistical claim). Do NOT change any technical claim, number,
citation, or the argument.

Show the edited text, then a short list of the substantive changes you made.

[PASTE text]`,
        },
      ],
    },
  ] as Stage[],

  disciplineTitle: 'The discipline that makes this safe',
  discipline: [
    'Stages 1–3 find and extract; stages 5–6 organize and draft; stage 7 is where you, personally, confirm every source exists and says what you claim. No prompt removes that step.',
    'The "use ONLY the sources below" guardrail in stages 5–7 is what keeps a frontier LLM from inventing references. Keep it in every drafting prompt.',
    'Swap the bracketed parts and this pack works for any review — the example just happens to be CRISPR-Cas MD.',
  ],
};
