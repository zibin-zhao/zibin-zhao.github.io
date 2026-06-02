const root = document.documentElement;

function setLang(l: string) {
  root.dataset.lang = l;
  root.setAttribute('lang', l === 'zh' ? 'zh' : 'en');
  try { localStorage.setItem('lang', l); } catch {}
}

document.querySelectorAll('.langtoggle').forEach((btn) => {
  btn.addEventListener('click', () => setLang(root.dataset.lang === 'zh' ? 'en' : 'zh'));
});
