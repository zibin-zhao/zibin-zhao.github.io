export type Lang = 'en' | 'zh';
export type Localized = { en: string; zh: string };
export const pages = ['home', 'research', 'projects', 'about', 'cv', 'contact', 'prompts'] as const;
export type Page = (typeof pages)[number];
export const t = (value: Localized, lang: Lang) => value[lang];
export function pathFor(page: Page, lang: Lang): string {
  return `${lang === 'zh' ? '/zh' : ''}/${page === 'home' ? '' : `${page}/`}`;
}
export const pageNames: Record<Page, Localized> = {
  home: { en: 'Home', zh: '首页' },
  research: { en: 'Research', zh: '研究' },
  projects: { en: 'Projects', zh: '项目' },
  about: { en: 'About', zh: '关于' },
  cv: { en: 'CV', zh: '履历' },
  contact: { en: 'Contact', zh: '联系' },
  prompts: { en: 'Prompt library', zh: '提示词库' },
};
export const descriptions: Record<Page, Localized> = {
  home: {
    en: 'Zibin Zhao, Bioengineering PhD student at HKUST. Molecular diagnostics and computational biology, research software, and personal projects.',
    zh: 'Zibin Zhao，香港科技大学生物工程博士生。分子诊断与计算生物学研究、相关软件和个人项目。',
  },
  research: {
    en: 'Research by Zibin Zhao in molecular diagnostics, aptamer design, and computational biology. Explore journal articles, a preprint, and associated code.',
    zh: 'Zibin Zhao 在分子诊断、适体设计与计算生物学领域的研究。浏览期刊论文、预印本及相关代码。',
  },
  projects: {
    en: 'Explore CasMD, DL-SELEX, Medit, and other tools and experiments by Zibin Zhao, with working demos and source code.',
    zh: '探索 Zibin Zhao 的 CasMD、DL-SELEX、Medit 等研究工具与个人作品，查看演示与源代码。',
  },
  about: {
    en: 'Zibin Zhao’s background and interests: Bioengineering at HKUST, biomedical engineering at Melbourne, music, design, and software.',
    zh: 'Zibin Zhao 的背景与兴趣：香港科技大学生物工程、墨尔本大学生物医学工程，以及音乐、设计和软件。',
  },
  cv: {
    en: 'Zibin Zhao’s education, research experience, selected publications, and technical skills. Read the CV online or download the PDF.',
    zh: 'Zibin Zhao 的教育背景、研究经历、代表论文与技术技能。在线阅读履历，或下载 PDF。',
  },
  contact: {
    en: 'Contact Zibin Zhao about research collaboration, software, or a project on this site. Email and professional profiles.',
    zh: '就科研合作、科学软件与数字产品联系 Zibin Zhao。查看邮箱和专业主页。',
  },
  prompts: {
    en: 'An eight-step prompt library for planning, reading, drafting, and checking a research review. Copy individual prompts or download the complete pack.',
    zh: '八步研究综述提示词库：从范围界定到阅读、写作和核验。复制单条提示词，或下载完整文本。',
  },
};
