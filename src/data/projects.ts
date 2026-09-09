import type { Localized } from '../lib/i18n';
export type ProjectCategory = 'research' | 'tools' | 'play';
export type Project = {
  id: string;
  name: string;
  category: ProjectCategory;
  type: Localized;
  summary: Localized;
  contribution: Localized;
  stack: string;
  href: string;
  action: Localized;
  source?: string;
  paper?: string;
};
export const categoryLabels: Record<ProjectCategory | 'all', Localized> = {
  all: { en: 'All work', zh: '全部作品' },
  research: { en: 'Research', zh: '科研' },
  tools: { en: 'Everyday tools', zh: '日常工具' },
  play: { en: 'Experiments', zh: '趣味实验' },
};
export const projects: Project[] = [
  {
    id: 'casmd',
    name: 'CasMD',
    category: 'research',
    type: { en: 'Scientific software', zh: '科学软件' },
    summary: {
      en: 'Tools for preparing protein and nucleic acid molecular dynamics simulations.',
      zh: '蛋白质与核酸分子动力学模拟的准备工具。',
    },
    contribution: {
      en: 'An open-source toolkit made at Hsing Lab, HKUST. Inspect the repository for setup instructions and supported workflows.',
      zh: '在香港科技大学 Hsing 实验室制作的开源工具。仓库包含安装说明和支持的工作流程。',
    },
    stack: 'Python · AmberTools · GROMACS',
    href: 'https://huggingface.co/spaces/zzhaobz/HsingMD',
    action: { en: 'Open toolkit', zh: '打开工具' },
    source: 'https://github.com/zibin-zhao/CasMD',
  },
  {
    id: 'dlselex',
    name: 'DL-SELEX',
    category: 'research',
    type: { en: 'Research + code', zh: '研究与代码' },
    summary: {
      en: 'Code for structure-enhanced deep learning in aptamer selection.',
      zh: '适体筛选研究中的结构增强深度学习代码。',
    },
    contribution: {
      en: 'First author of the associated Briefings in Bioinformatics paper. Code and notebooks are available in the project repository.',
      zh: '相关 Briefings in Bioinformatics 论文第一作者。项目仓库提供代码和 Notebook。',
    },
    stack: 'Python · Jupyter · Deep learning',
    href: 'https://doi.org/10.1093/bib/bbaf680',
    action: { en: 'Read paper', zh: '阅读论文' },
    source: 'https://github.com/zibin-zhao/DL-SELEX',
  },
  {
    id: 'medit',
    name: 'Medit',
    category: 'tools',
    type: { en: 'Personal web app', zh: '个人 Web 应用' },
    summary: {
      en: 'A journal with daily reflection and small grounding exercises.',
      zh: '日记、每日反思和放松练习。',
    },
    contribution: {
      en: 'An independent web application for writing and reflection, with offline support.',
      zh: '独立制作的写作与反思应用，支持离线使用。',
    },
    stack: 'Web app · Journaling · PWA',
    href: '/medit/',
    action: { en: 'Try Medit', zh: '体验 Medit' },
  },
  {
    id: 'tempo',
    name: 'TEMPO',
    category: 'research',
    type: { en: 'Research companion', zh: '研究配套项目' },
    summary: {
      en: 'Code accompanying a one-pot CRISPR diagnostics study published in Nature Communications.',
      zh: '配套于 Nature Communications 一锅式 CRISPR 诊断研究的代码项目。',
    },
    contribution: {
      en: 'Co-author, responsible for software, with contributions to methodology, validation, formal analysis, and data curation.',
      zh: '论文共同作者，负责软件，并参与方法开发、验证、正式分析与数据整理。',
    },
    stack: 'Python · JavaScript · Vue',
    href: 'https://github.com/zibin-zhao/TEMPO',
    action: { en: 'Explore code', zh: '查看代码' },
    paper: 'https://doi.org/10.1038/s41467-026-75358-1',
  },
  {
    id: 'singularity',
    name: 'Singularity',
    category: 'play',
    type: { en: 'Interactive experiment', zh: '交互实验' },
    summary: {
      en: 'An interactive particle universe built with Three.js.',
      zh: '用 Three.js 制作的交互式粒子宇宙。',
    },
    contribution: {
      en: 'A browser experiment built around particles, shader effects, and direct interaction. Performance depends on the device.',
      zh: '围绕粒子、着色器效果和直接交互制作的浏览器实验。运行效果取决于设备。',
    },
    stack: 'Three.js · GLSL · WebGL',
    href: '/singularity/',
    action: { en: 'Enter the universe', zh: '进入粒子宇宙' },
  },
  {
    id: 'yaos',
    name: 'Yaos',
    category: 'tools',
    type: { en: 'Personal web app', zh: '个人 Web 应用' },
    summary: {
      en: 'Medicine Buddha readings, a seasonal calendar, and daily reflection.',
      zh: '药师法门阅读、节气日历与日常自省。',
    },
    contribution: {
      en: 'An independent interface experiment. Explore the project and its documentation on GitHub.',
      zh: '一个独立制作的界面实验。可在 GitHub 查看项目与说明。',
    },
    stack: 'Web app · Interaction design',
    href: 'https://github.com/zibin-zhao/Yaos',
    action: { en: 'Explore project', zh: '查看项目' },
  },
];
