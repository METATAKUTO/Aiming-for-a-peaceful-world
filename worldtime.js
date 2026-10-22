// ==========================================
// 世界時計プラグイン (worldtime.js)
// ==========================================

// 国旗や言語コードから大まかなタイムゾーンを推測するマッピング
const langTimezones = {
  ja: 'Asia/Tokyo',
  en: 'America/New_York',
  ko: 'Asia/Seoul',
  zh: 'Asia/Shanghai',
  es: 'Europe/Madrid',
  fr: 'Europe/Paris',
  de: 'Europe/Berlin'
};

// 指定したタイムゾーンの現在時刻文字列を取得する関数
window.getPeerCurrentTime = function(langCode) {
  const tz = langTimezones[langCode] || 'UTC';
  try {
    const now = new Date();
    return now.toLocaleTimeString([], { timeZone: tz, hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '12:00';
  }
};

// 5分おき（300,000ミリ秒）に画面上の相手の時間を自動更新するタイマー
setInterval(() => {
  const timeElements = document.querySelectorAll('.peer-world-time');
  timeElements.forEach(el => {
    const lang = el.getAttribute('data-lang');
    if (lang) {
      el.textContent = window.getPeerCurrentTime(lang);
    }
  });
}, 300000); // 5分間隔