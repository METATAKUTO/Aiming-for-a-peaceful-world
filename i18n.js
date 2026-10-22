// ==========================================
// UI多言語対応プラグイン (i18n.js) - 修正版
// ==========================================

const uiTranslations = {
  ja: {
    feedTitle: "平和な空間",
    profileBtn: "プロフィール",
    searchPlaceholder: "キーワードや #ハッシュタグ で検索...",
    postPlaceholder: "いまどんな気分？ #平和 などのタグをつけて投稿...",
    postBtn: "投稿",
    bookmarksNav: "🔖 ブックマーク一覧",
    dmNav: "💬 フレンドDM",
    noticeText: "⚠️ 誹謗中傷や争いを避け、優しさと笑顔の共有をお願いします。",
    profileModalTitle: "プロフィール設定",
    displayName: "表示名",
    avatarLabel: "アイコン画像 (ファイル または URL)",
    langLabel: "あなたの言語 (国旗バッジに反映)",
    saveBtn: "保存する"
  },
  en: {
    feedTitle: "Peaceful Space",
    profileBtn: "Profile",
    searchPlaceholder: "Search keywords or #hashtags...",
    postPlaceholder: "How are you feeling? Tag with #peace...",
    postBtn: "Post",
    bookmarksNav: "🔖 Bookmarks",
    dmNav: "💬 Friend DM",
    noticeText: "⚠️ Avoid conflicts and share smiles and kindness.",
    profileModalTitle: "Profile Settings",
    displayName: "Display Name",
    avatarLabel: "Avatar (File or URL)",
    langLabel: "Your Language (Flag Badge)",
    saveBtn: "Save"
  },
  ko: {
    feedTitle: "평화로운 공간",
    profileBtn: "프로필",
    searchPlaceholder: "키워드 또는 #해시태그 검색...",
    postPlaceholder: "어떤 기분인가요? #평화 태그를 달아보세요...",
    postBtn: "게시",
    bookmarksNav: "🔖 북마크",
    dmNav: "💬 친구 DM",
    noticeText: "⚠️ 비방과 싸움을 피하고 미소와 친절을 공유하세요.",
    profileModalTitle: "프로필 설정",
    displayName: "표시 이름",
    avatarLabel: "아이콘 (파일 또는 URL)",
    langLabel: "사용 언어",
    saveBtn: "저장"
  },
  zh: {
    feedTitle: "和平空间",
    profileBtn: "个人资料",
    searchPlaceholder: "搜索关键词或 #标签...",
    postPlaceholder: "今天心情如何？添加 #和平 标签...",
    postBtn: "发布",
    bookmarksNav: "🔖 书签",
    dmNav: "💬 好友私信",
    noticeText: "⚠️ 避免争吵，分享微笑与善意。",
    profileModalTitle: "个人资料设置",
    displayName: "显示名称",
    avatarLabel: "头像 (文件 或 URL)",
    langLabel: "您的语言",
    saveBtn: "保存"
  },
  es: {
    feedTitle: "Espacio Pacífico",
    profileBtn: "Perfil",
    searchPlaceholder: "Buscar palabras clave o #hashtags...",
    postPlaceholder: "¿Cómo te sientes? Usa #paz...",
    postBtn: "Publicar",
    bookmarksNav: "🔖 Favoritos",
    dmNav: "💬 Mensajes DM",
    noticeText: "⚠️ Evita conflictos y comparte sonrisas.",
    profileModalTitle: "Ajustes de Perfil",
    displayName: "Nombre",
    avatarLabel: "Avatar (Archivo o URL)",
    langLabel: "Tu Idioma",
    saveBtn: "Guardar"
  },
  fr: {
    feedTitle: "Espace Paisible",
    profileBtn: "Profil",
    searchPlaceholder: "Rechercher des mots-clés ou #hashtags...",
    postPlaceholder: "Comment vous sentez-vous ? Utilisez #paix...",
    postBtn: "Publier",
    bookmarksNav: "🔖 Favoris",
    dmNav: "💬 Messages DM",
    noticeText: "⚠️ Évitez les conflits et partagez des sourires.",
    profileModalTitle: "Paramètres du Profil",
    displayName: "Nom d'affichage",
    avatarLabel: "Avatar (Fichier ou URL)",
    langLabel: "Votre Langue",
    saveBtn: "Enregistrer"
  },
  de: {
    feedTitle: "Friedlicher Raum",
    profileBtn: "Profil",
    searchPlaceholder: "Nach Keywords oder #Hashtags suchen...",
    postPlaceholder: "Wie fühlst du dich? Teile es mit #frieden...",
    postBtn: "Beitrag",
    bookmarksNav: "🔖 Lesezeichen",
    dmNav: "💬 Freunde DM",
    noticeText: "⚠️ Vermeide Streit und teile Freundlichkeit.",
    profileModalTitle: "Profil-Einstellungen",
    displayName: "Anzeigename",
    avatarLabel: "Datei oder URL",
    langLabel: "Deine Sprache",
    saveBtn: "Speichern"
  }
};

// UIを現在のユーザー言語に書き換える関数
window.applyUI18n = function(lang) {
  const t = uiTranslations[lang] || uiTranslations['ja'];

  const feedHeaderSpan = document.querySelector('.main-feed > header.feed-header > span');
  if (feedHeaderSpan) feedHeaderSpan.textContent = t.feedTitle;

  const profileBtn = document.querySelector('button.settings-btn');
  if (profileBtn) profileBtn.textContent = t.profileBtn;

  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.placeholder = t.searchPlaceholder;

  const tweetText = document.getElementById('tweetText');
  if (tweetText) tweetText.placeholder = t.postPlaceholder;

  const postSubmitBtn = document.querySelector('.post-submit-btn');
  if (postSubmitBtn) postSubmitBtn.textContent = t.postBtn;

  const bookmarkNavBtn = document.getElementById('bookmarkNavBtn');
  if (bookmarkNavBtn) bookmarkNavBtn.innerHTML = t.bookmarksNav;

  const sidebarDmBtn = document.getElementById('sidebarDmBtn');
  if (sidebarDmBtn) sidebarDmBtn.innerHTML = t.dmNav;

  const brandNotice = document.getElementById('brandNotice');
  if (brandNotice) brandNotice.innerHTML = t.noticeText;
};