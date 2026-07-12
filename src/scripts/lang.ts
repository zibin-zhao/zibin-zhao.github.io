const root = document.documentElement;

type Lang = 'en' | 'zh';

const labels: Record<Lang, string> = {
  en: 'Switch language / 切换语言 — English active; switch to 中文',
  zh: 'Switch language / 切换语言 — 中文已启用；切换到 English',
};

const currentLang = (): Lang => root.dataset.lang === 'zh' ? 'zh' : 'en';

function syncToggle(button: HTMLButtonElement, lang: Lang) {
  const zhActive = lang === 'zh';
  button.setAttribute('aria-pressed', String(zhActive));
  button.setAttribute('aria-label', labels[lang]);
}

function setLang(lang: Lang) {
  root.dataset.lang = lang;
  root.setAttribute('lang', lang);
  document.querySelectorAll<HTMLButtonElement>('.langtoggle').forEach((button) => syncToggle(button, lang));
  try { localStorage.setItem('lang', lang); } catch { /* Local storage may be unavailable. */ }
}

document.querySelectorAll<HTMLButtonElement>('.langtoggle').forEach((button) => {
  syncToggle(button, currentLang());
  button.addEventListener('click', () => setLang(currentLang() === 'zh' ? 'en' : 'zh'));
});
