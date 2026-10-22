// ==========================================
// テーマ切り替えプラグイン (theme.js)
// ==========================================
let currentTheme = localStorage.getItem('peace_theme') || 'dark';

function applyTheme(theme) {
  currentTheme = theme;
  localStorage.setItem('peace_theme', theme);
  let root = document.documentElement;
  if (theme === 'light') {
    root.style.setProperty('--bg-color', '#f0f2f5');
    root.style.setProperty('--card-bg', '#ffffff');
    root.style.setProperty('--border-color', '#e1e8ed');
    root.style.setProperty('--text-primary', '#0f1419');
    root.style.setProperty('--text-secondary', '#536471');
  } else {
    root.style.setProperty('--bg-color', '#000000');
    root.style.setProperty('--card-bg', '#16181c');
    root.style.setProperty('--border-color', '#2f3336');
    root.style.setProperty('--text-primary', '#e7e9ea');
    root.style.setProperty('--text-secondary', '#71767b');
  }
}
applyTheme(currentTheme);

window.toggleTheme = function() {
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  const btn = document.getElementById('themeToggleBtn');
  if (btn) btn.innerHTML = newTheme === 'dark' ? '🌙 ダークモード' : '☀️ ライトモード';
}