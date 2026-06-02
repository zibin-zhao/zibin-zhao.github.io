type L = { en: string; zh: string };
type Notes = { en: string[]; zh: string[] };
type Entry = { title: L; org: L; period: L; notes: Notes };

export const cv: {
  pdf: string;
  education: Entry[];
  experience: Entry[];
  leadership: Entry[];
  skills: string[];
  download: L;
} = {
  pdf: '/cv.pdf',
  education: [
    {
      title: { en: 'Ph.D., Bioengineering', zh: '生物工程博士' },
      org: { en: 'The Hong Kong University of Science and Technology', zh: '香港科技大学' },
      period: { en: '2022–present', zh: '2022–至今' },
      notes: {
        en: ['HKPFS + Redbird Award (2022)', 'Hsing Lab'],
        zh: ['香港博士研究生奖学金（HKPFS）+ Redbird 奖（2022）', 'Hsing 实验室'],
      },
    },
    {
      title: { en: 'B.S., Biomedical Engineering', zh: '生物医学工程学士' },
      org: { en: 'University of Melbourne', zh: '墨尔本大学' },
      period: { en: '', zh: '' },
      notes: { en: ['First Class Honours'], zh: ['一等荣誉'] },
    },
  ],
  experience: [
    {
      title: { en: 'Co-founder & CEO', zh: '联合创始人兼 CEO' },
      org: { en: 'PealthMed Ltd', zh: 'PealthMed Ltd' },
      period: { en: 'Present', zh: '至今' },
      notes: { en: [], zh: [] },
    },
    {
      title: { en: 'Research Assistant', zh: '研究助理' },
      org: { en: 'The Hong Kong University of Science and Technology', zh: '香港科技大学' },
      period: { en: '2021–2022', zh: '2021–2022' },
      notes: {
        en: ['Wearable wireless real-time 12-lead ECG monitoring', 'Filter bank + deep learning for heart-disease classification'],
        zh: ['可穿戴无线实时 12 导联心电监测', '滤波器组 + 深度学习用于心脏病分类'],
      },
    },
  ],
  leadership: [
    {
      title: { en: 'President & Event Director', zh: '会长兼活动总监' },
      org: { en: 'Chinese Music Group, University of Melbourne', zh: '墨尔本大学中乐团' },
      period: { en: '2020', zh: '2020' },
      notes: { en: ['5,000+ members'], zh: ['5,000+ 名成员'] },
    },
  ],
  skills: ['Python', 'C', 'MATLAB', 'LabVIEW', 'SolidWorks'],
  download: { en: '⬇ Download CV (PDF)', zh: '⬇ 下载简历（PDF）' },
};
