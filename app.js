// ==========================================
// 平和 (Peaceful Board) - フレンド申請キャンセル対応版
// ==========================================

// Firebase 初期化
const firebaseConfig = {
  apiKey: "AIzaSyAB5Re2L2mEQ78dF07j57gbGWZIWCMEqBg",
  authDomain: "sekai-fce79.firebaseapp.com",
  projectId: "sekai-fce79",
  storageBucket: "sekai-fce79.firebasestorage.app",
  messagingSenderId: "954332998111",
  appId: "1:954332998111:web:90e96fafe26d1ff42f7c6a",
  measurementId: "G-MEFWT72T5R"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// --- 端末固有のデバイスID ---
let deviceId = localStorage.getItem('peace_device_id');
if (!deviceId) {
  deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  localStorage.setItem('peace_device_id', deviceId);
}

// --- 状態変数 ---
let userProfile = JSON.parse(localStorage.getItem('peace_profile')) || {
  name: '',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  lang: 'ja',
  flag: '🇯🇵'
};

let friends = JSON.parse(localStorage.getItem('peace_friends')) || [];
let pendingRequestsOut = JSON.parse(localStorage.getItem('peace_requests_out')) || [];
let pendingRequestsIn = JSON.parse(localStorage.getItem('peace_requests_in')) || [];
let blockedUsers = JSON.parse(localStorage.getItem('peace_blocked')) || [];
let bookmarks = JSON.parse(localStorage.getItem('peace_bookmarks')) || [];
let dms = JSON.parse(localStorage.getItem('peace_dms')) || {};

let tweets = [];
let registeredUsers = {};
let searchQuery = '';
let currentFilterMode = 'all';
let notifications = JSON.parse(localStorage.getItem('peace_notifications')) || [];
let currentChatFriend = null;
let currentMediaBase64 = '';

const sideAvatar = document.getElementById('sideAvatar');
const sideName = document.getElementById('sideName');
const sideLang = document.getElementById('sideLang');
const postAvatar = document.getElementById('postAvatar');
const profileModal = document.getElementById('profileModal');
const notificationsModal = document.getElementById('notificationsModal');
const inputName = document.getElementById('inputName');
const inputAvatarUrl = document.getElementById('inputAvatarUrl');
const inputAvatarFile = document.getElementById('inputAvatarFile');
const inputLang = document.getElementById('inputLang');
const notifBadge = document.getElementById('notifBadge');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');

const langFlags = { ja: '🇯🇵', en: '🇺🇸', ko: '🇰🇷', zh: '🇨🇳', es: '🇪🇸', fr: '🇫🇷', de: '🇩🇪' };

function saveLocalSettings() {
  localStorage.setItem('peace_profile', JSON.stringify(userProfile));
  localStorage.setItem('peace_friends', JSON.stringify(friends));
  localStorage.setItem('peace_requests_out', JSON.stringify(pendingRequestsOut));
  localStorage.setItem('peace_requests_in', JSON.stringify(pendingRequestsIn));
  localStorage.setItem('peace_blocked', JSON.stringify(blockedUsers));
  localStorage.setItem('peace_bookmarks', JSON.stringify(bookmarks));
  localStorage.setItem('peace_dms', JSON.stringify(dms));
  localStorage.setItem('peace_notifications', JSON.stringify(notifications));
  if (userProfile.name) {
    localStorage.setItem('peace_username', userProfile.name);
  }
}

// --- Firestore リアルタイムリスナー ---
function initRealtimeSync() {
  db.collection('tweets').orderBy('id', 'desc').onSnapshot((snapshot) => {
    tweets = [];
    snapshot.forEach((doc) => {
      tweets.push(doc.data());
    });
    renderTweets();
  }, (error) => {
    console.warn("Firestoreツイート同期警告: ", error);
  });

  db.collection('users').onSnapshot((snapshot) => {
    registeredUsers = {};
    snapshot.forEach((doc) => {
      registeredUsers[doc.id] = doc.data().deviceId;
    });
  }, (error) => {
    console.warn("Firestoreユーザー同期警告: ", error);
  });

  if (userProfile.name) {
    try {
      db.collection('friendRequests').where('to', '==', userProfile.name).onSnapshot((snapshot) => {
        pendingRequestsIn = [];
        snapshot.forEach((doc) => {
          pendingRequestsIn.push(doc.data());
        });
        saveLocalSettings();
        updateNotificationBadge();
      }, (err) => {
        console.warn("フレンド申請同期警告:", err);
      });
    } catch (e) {
      console.warn("フレンド申請リスナーエラー:", e);
    }
  }
}

function updateNotificationBadge() {
  const totalCount = notifications.length + pendingRequestsIn.length;
  if (totalCount > 0) {
    notifBadge.style.display = 'inline-block';
    notifBadge.textContent = totalCount;
  } else {
    notifBadge.style.display = 'none';
    notifBadge.textContent = '0';
  }
}

async function claimUsername(name) {
  const userDocRef = db.collection('users').doc(name);
  try {
    const doc = await userDocRef.get();
    if (doc.exists) {
      if (doc.data().deviceId === deviceId) return true;
      return false;
    } else {
      await userDocRef.set({ deviceId: deviceId });
      return true;
    }
  } catch (err) {
    console.error("名前登録エラー:", err);
    return false;
  }
}

function checkInitialSetup() {
  const savedName = localStorage.getItem('peace_username');
  if (!savedName && !userProfile.name) {
    showNameInputModal();
  } else {
    if (savedName) userProfile.name = savedName;
    claimUsername(userProfile.name).then((success) => {
      if (!success) {
        alert("⚠️ 前回の名前は現在他の方が使用中のためリセットされました。");
        localStorage.removeItem('peace_username');
        userProfile.name = '';
        showNameInputModal();
      } else {
        updateProfileUI();
        initRealtimeSync();
        updateNotificationBadge();
      }
    });
  }
}

function showNameInputModal() {
  const nameInputModal = document.createElement('div');
  nameInputModal.id = 'nameInputModalOverlay';
  nameInputModal.className = 'modal-overlay';
  nameInputModal.style.display = 'flex';
  nameInputModal.style.zIndex = '999';
  nameInputModal.innerHTML = `
    <div class="modal-content" style="text-align: center;">
      <div class="modal-title" style="justify-content: center;">🕊️ 平和な空間へようこそ</div>
      <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 16px;">
        他の人と被らない、あなただけの表示名を入力してください。
      </p>
      <input type="text" id="firstUserName" class="form-input" placeholder="例: 平和すき" style="margin-bottom: 16px;" required>
      <button id="firstUserSubmit" class="modal-submit">はじめる</button>
    </div>
  `;
  document.body.appendChild(nameInputModal);

  document.getElementById('firstUserSubmit').addEventListener('click', async () => {
    const val = document.getElementById('firstUserName').value.trim();
    if (!val) return;

    const success = await claimUsername(val);
    if (!success) {
      alert("❌ その名前は既に他の方が使用しています。別の名前を入力してください。");
      return;
    }

    userProfile.name = val;
    saveLocalSettings();
    nameInputModal.remove();
    updateProfileUI();
    initRealtimeSync();
  });
}

function playNotificationSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch (e) {
    console.log("通知音エラー", e);
  }
}

// --- メニュー構成の注入 ---
function injectBrandNotice() {
  const brandLogo = document.querySelector('.brand-logo');
  if (brandLogo && !document.getElementById('brandNotice')) {
    const noticeDiv = document.createElement('div');
    noticeDiv.id = 'brandNotice';
    noticeDiv.style.cssText = 'font-size: 0.7rem; color: var(--text-secondary); padding-left: 4px; margin-top: -6px; margin-bottom: 12px; line-height: 1.3;';
    noticeDiv.innerHTML = '⚠️ 誹謗中傷や争いを避け、優しさと笑顔の共有を。';
    brandLogo.after(noticeDiv);
  }

  const sidebar = document.querySelector('.sidebar-left > div:first-child');
  if (sidebar && !document.getElementById('sidebarBtnsContainer')) {
    const container = document.createElement('div');
    container.id = 'sidebarBtnsContainer';
    container.style.cssText = 'display:flex; flex-direction:column; gap:8px; margin-top:8px;';
    
    container.innerHTML = `
      <button onclick="toggleTheme()" id="themeToggleBtn" style="background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); width: 100%; padding: 10px; border-radius: 9999px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 8px;">
        ${typeof currentTheme !== 'undefined' && currentTheme === 'light' ? '☀️ ライトモード' : '🌙 ダークモード'}
      </button>
      <button onclick="toggleBookmarkView()" id="bookmarkNavBtn" style="background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); width: 100%; padding: 10px; border-radius: 9999px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 8px;">
        🔖 ブックマーク一覧
      </button>
      <button onclick="toggleMyPostsView()" id="myPostsNavBtn" style="background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); width: 100%; padding: 10px; border-radius: 9999px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 8px;">
        👤 自分の投稿
      </button>
      <button onclick="openDmListModal()" id="sidebarDmBtn" style="background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); width: 100%; padding: 10px; border-radius: 9999px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 8px;">
        💬 フレンドDM
      </button>
      <button onclick="openTermsModal()" id="sidebarTermsBtn" style="background: transparent; border: 1px solid var(--border-color); color: var(--text-secondary); width: 100%; padding: 8px; border-radius: 9999px; cursor: pointer; font-weight: bold; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; gap: 8px;">
        ⚠️ ご注意・利用規約
      </button>
    `;
    sidebar.appendChild(container);
  }
}

window.toggleSideMenu = function() {
  const sidebar = document.getElementById('sidebarLeft');
  const backdrop = document.getElementById('menuBackdrop');
  if (!sidebar || !backdrop) return;

  const isOpen = sidebar.classList.contains('open');
  if (isOpen) {
    sidebar.classList.remove('open');
    backdrop.style.display = 'none';
  } else {
    sidebar.classList.add('open');
    backdrop.style.display = 'block';
  }
}

window.openTermsModal = function() {
  let termsModal = document.getElementById('termsModal');
  if (!termsModal) {
    termsModal = document.createElement('div');
    termsModal.id = 'termsModal';
    termsModal.className = 'modal-overlay';
    document.body.appendChild(termsModal);
  }
  termsModal.style.display = 'flex';
  
  termsModal.innerHTML = `
    <div class="modal-content" style="max-width: 450px; max-height: 85vh; overflow-y: auto;">
      <div class="modal-title" style="justify-content: center;">🕊️ ご注意・利用規約</div>
      <div style="color: var(--text-primary); font-size: 0.9rem; line-height: 1.7; margin: 16px 0; text-align: left; background: rgba(255,255,255,0.03); padding: 16px; border-radius: 12px; border: 1px solid var(--border-color);">
        <p style="margin-bottom: 12px; font-weight: bold; color: var(--accent-color);">📋 ご利用について</p>
        <p style="margin-bottom: 8px;">• 投稿は無制限に行っていただけますが、企業様や商業広告などの営利目的でのご利用は固くお断りいたします。</p>
        <p style="margin-bottom: 16px;">• 本サービスは完全個人でのみのご使用となります。</p>

        <p style="margin-bottom: 12px; font-weight: bold; color: var(--pink-color);">🚫 禁止事項について</p>
        <p style="margin-bottom: 8px;">• 政治的な話題、思想の主張、および特定の人物・団体への批判や攻撃は絶対にしないでください。</p>
        <p style="margin-bottom: 16px;">• 誹謗中傷、争いを生む発言、公序良俗に反する内容は一切禁止です。</p>

        <p style="margin-bottom: 8px; font-weight: bold; color: #00b900;">✨ 平和な空間づくりのために</p>
        <p>当プラットフォームは、世界中の人々が優しさ、笑顔、日常の美しい瞬間を安心して分かち合うための場所です。お互いを思いやり、温かいコミュニケーションを心がけて楽しくご利用ください。</p>
      </div>
      <button onclick="closeModal('termsModal')" class="modal-submit" style="width: 100%;">同意して閉じる</button>
    </div>
  `;
}

function updateProfileUI() {
  sideAvatar.src = userProfile.avatar;
  postAvatar.src = userProfile.avatar;
  sideName.textContent = userProfile.name;
  userProfile.flag = langFlags[userProfile.lang] || '🌐';
  
  const langNames = { ja: '日本語', en: '英語', ko: '韓国語', zh: '中国語', es: 'スペイン語', fr: 'フランス語', de: 'ドイツ語' };
  sideLang.textContent = `${userProfile.flag} ${langNames[userProfile.lang] || userProfile.lang}`;
  injectBrandNotice();

  if (typeof window.applyUI18n === 'function') {
    window.applyUI18n(userProfile.lang);
  }
}

window.openProfileModal = function() {
  inputName.value = userProfile.name;
  inputAvatarUrl.value = userProfile.avatar;
  inputLang.value = userProfile.lang;
  profileModal.style.display = 'flex';
}

window.openNotificationsModal = function() {
  notificationsModal.style.display = 'flex';
  renderNotifications();
  notifications = [];
  saveLocalSettings();
  updateNotificationBadge();
}

window.closeModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'none';
}

window.toggleBookmarkView = function() {
  const btn = document.getElementById('bookmarkNavBtn');
  const myPostsBtn = document.getElementById('myPostsNavBtn');

  if (currentFilterMode === 'bookmarks') {
    currentFilterMode = 'all';
    btn.style.borderColor = 'var(--border-color)';
    btn.style.color = 'var(--text-primary)';
  } else {
    currentFilterMode = 'bookmarks';
    btn.style.borderColor = 'var(--accent-color)';
    btn.style.color = 'var(--accent-color)';
    if (myPostsBtn) {
      myPostsBtn.style.borderColor = 'var(--border-color)';
      myPostsBtn.style.color = 'var(--text-primary)';
    }
  }
  renderTweets();
}

window.toggleMyPostsView = function() {
  const btn = document.getElementById('myPostsNavBtn');
  const bookmarkBtn = document.getElementById('bookmarkNavBtn');

  if (currentFilterMode === 'my_posts') {
    currentFilterMode = 'all';
    btn.style.borderColor = 'var(--border-color)';
    btn.style.color = 'var(--text-primary)';
  } else {
    currentFilterMode = 'my_posts';
    btn.style.borderColor = 'var(--accent-color)';
    btn.style.color = 'var(--accent-color)';
    if (bookmarkBtn) {
      bookmarkBtn.style.borderColor = 'var(--border-color)';
      bookmarkBtn.style.color = 'var(--text-primary)';
    }
  }
  renderTweets();
}

window.toggleBookmark = function(id) {
  if (bookmarks.includes(id)) {
    bookmarks = bookmarks.filter(bId => bId !== id);
  } else {
    bookmarks.push(id);
  }
  saveLocalSettings();
  renderTweets();
}

async function updateTweetInFirestore(tweet) {
  await db.collection('tweets').doc(String(tweet.id)).set(tweet);
}

window.deleteTweet = async function(tweetId, tweetDeviceId) {
  if (tweetDeviceId && tweetDeviceId !== deviceId) {
    alert("❌ この投稿は他のユーザーの投稿であるため削除できません。");
    return;
  }
  if (confirm("この投稿を削除しますか？")) {
    try {
      await db.collection('tweets').doc(String(tweetId)).delete();
    } catch (err) {
      console.error("削除エラー: ", err);
      alert("削除に失敗しました。");
    }
  }
}

window.toggleReaction = async function(tweetId, stampKey) {
  const tweet = tweets.find(t => t.id === tweetId);
  if (!tweet) return;

  if (!tweet.reactions) {
    tweet.reactions = { thanks: 0, peace: 0, celebrate: 0, healing: 0 };
  }

  if (tweet.userReaction === stampKey) {
    tweet.reactions[stampKey] = Math.max(0, (tweet.reactions[stampKey] || 1) - 1);
    tweet.userReaction = null;
  } else {
    if (tweet.userReaction) {
      tweet.reactions[tweet.userReaction] = Math.max(0, (tweet.reactions[tweet.userReaction] || 1) - 1);
    }
    tweet.reactions[stampKey] = (tweet.reactions[stampKey] || 0) + 1;
    tweet.userReaction = stampKey;
  }

  await updateTweetInFirestore(tweet);
}

window.requestFriend = async function(userName) {
  if (userName === userProfile.name) {
    alert("自分自身にフレンド申請は送れません。");
    return;
  }
  if (friends.includes(userName)) {
    alert(`${userName} さんとは既にフレンドです。`);
    return;
  }
  if (pendingRequestsOut.includes(userName)) {
    alert(`${userName} さんには既に申請済みです。`);
    return;
  }

  try {
    const requestId = userProfile.name + '_' + userName;
    await db.collection('friendRequests').doc(requestId).set({
      from: userProfile.name,
      to: userName,
      time: Date.now()
    });

    pendingRequestsOut.push(userName);
    saveLocalSettings();
    alert(`${userName} さんにフレンド申請を送信しました！`);
    renderTweets();
  } catch (err) {
    console.error("フレンド申請エラー:", err);
    alert("フレンド申請の送信に失敗しました。");
  }
}

// --- フレンド申請のキャンセル（取り消し）機能 ---
window.cancelFriendRequest = async function(userName) {
  if (!confirm(`${userName} さんへのフレンド申請を取り消しますか？`)) return;

  try {
    const requestId = userProfile.name + '_' + userName;
    await db.collection('friendRequests').doc(requestId).delete();

    pendingRequestsOut = pendingRequestsOut.filter(u => u !== userName);
    saveLocalSettings();
    alert(`${userName} さんへのフレンド申請を取り消しました。`);
    renderTweets();
  } catch (err) {
    console.error("申請キャンセルエラー:", err);
    alert("申請の取り消しに失敗しました。");
  }
}

window.acceptFriend = async function(userName) {
  if (!friends.includes(userName)) {
    friends.push(userName);
    if (!dms[userName]) dms[userName] = [];
  }
  
  try {
    const requestId = userName + '_' + userProfile.name;
    await db.collection('friendRequests').doc(requestId).delete();
  } catch(e) {}

  pendingRequestsIn = pendingRequestsIn.filter(r => r.from !== userName);
  pendingRequestsOut = pendingRequestsOut.filter(u => u !== userName);
  
  saveLocalSettings();
  addNotification(`${userName} さんとフレンドになりました！🤝`);
  alert(`${userName} さんのフレンド申請を承認しました！`);
  openDmListModal();
  renderTweets();
}

window.rejectFriend = async function(userName) {
  try {
    const requestId = userName + '_' + userProfile.name;
    await db.collection('friendRequests').doc(requestId).delete();
  } catch(e) {}

  pendingRequestsIn = pendingRequestsIn.filter(r => r.from !== userName);
  saveLocalSettings();
  openDmListModal();
  renderTweets();
}

window.removeFriend = function(userName) {
  if (confirm(`${userName} さんをフレンドから削除しますか？`)) {
    friends = friends.filter(f => f !== userName);
    saveLocalSettings();
    openDmListModal();
    renderTweets();
  }
}

window.unblockUser = function(userName) {
  blockedUsers = blockedUsers.filter(b => b !== userName);
  saveLocalSettings();
  alert(`${userName} さんのブロックを解除しました。`);
  openDmListModal();
  renderTweets();
}

window.openDmListModal = function() {
  let dmModal = document.getElementById('dmListModal');
  if (!dmModal) {
    dmModal = document.createElement('div');
    dmModal.id = 'dmListModal';
    dmModal.className = 'modal-overlay';
    document.body.appendChild(dmModal);
  }
  dmModal.style.display = 'flex';
  
  dmModal.innerHTML = `
    <div class="modal-content" style="max-height: 80vh; overflow-y: auto;">
      <div class="modal-title">
        <span>フレンド＆メッセージ 💬</span>
        <button onclick="closeModal('dmListModal')" style="background:none; border:none; color:white; cursor:pointer;">✕</button>
      </div>

      ${pendingRequestsIn.length > 0 ? `
        <div style="margin-bottom: 20px; background: rgba(29, 155, 240, 0.1); border: 1px solid var(--accent-color); padding: 12px; border-radius: 12px;">
          <div style="font-weight: bold; font-size: 0.9rem; color: var(--accent-color); margin-bottom: 8px;">📩 届いているフレンド申請 (${pendingRequestsIn.length})</div>${pendingRequestsIn.map(r => `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size:0.85rem; font-weight:bold;">👤 ${escapeHtml(r.from)}</span>
              <div style="display:flex; gap:6px;">
                <button onclick="acceptFriend('${escapeHtml(r.from)}')" style="background: #00b900; border:none; color:white; font-size:0.75rem; padding:4px 10px; border-radius:9999px; cursor:pointer; font-weight:bold;">承認</button>
                <button onclick="rejectFriend('${escapeHtml(r.from)}')" style="background:transparent; border:1px solid var(--text-secondary); color:var(--text-secondary); font-size:0.75rem; padding:4px 8px; border-radius:9999px; cursor:pointer;">拒否</button>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${pendingRequestsOut.length > 0 ? `
        <div style="margin-bottom: 20px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); padding: 12px; border-radius: 12px;">
          <div style="font-weight: bold; font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px;">⏳ 送信中のフレンド申請 (${pendingRequestsOut.length})</div>${pendingRequestsOut.map(u => `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size:0.85rem;">👤 ${escapeHtml(u)}</span>
              <button onclick="cancelFriendRequest('${escapeHtml(u)}')" style="background:none; border:1px solid #ff4949; color:#ff4949; font-size:0.75rem; padding:2px 8px; border-radius:9999px; cursor:pointer;">取り消し</button>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div style="margin-bottom: 20px;">
        <div style="font-weight: bold; font-size: 0.9rem; color: var(--accent-color); margin-bottom: 8px; border-bottom: 1px solid var(--border-color); padding-bottom: 4px;">💬 トークを開始</div>
        ${friends.length === 0 ? '<p style="color:var(--text-secondary); font-size:0.85rem; padding:6px 0;">トークできるフレンドがいません。</p>' : ''}
        ${friends.map(f => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 12px; margin-bottom: 6px; cursor: pointer;" onclick="openChat('${f}')">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:1.1rem;">👤</span>
              <div>
                <span style="font-weight:bold; font-size:0.9rem;">${escapeHtml(f)}</span>
                <span style="font-size:0.7rem; color:var(--text-secondary); margin-left:8px;">🌍 現地時間: <span class="peer-world-time" data-lang="en">${window.getPeerCurrentTime ? window.getPeerCurrentTime('en') : '12:00'}</span></span>
              </div>
            </div>
            <span style="font-size: 0.8rem; color: var(--accent-color);">トークを開く ➔</span>
          </div>
        `).join('')}
      </div>

      <div style="margin-bottom: 20px;">
        <div style="font-weight: bold; font-size: 0.9rem; color: #00b900; margin-bottom: 8px; border-bottom: 1px solid var(--border-color); padding-bottom: 4px;">👥 フレンド一覧 (${friends.length})</div>
        ${friends.length === 0 ? '<p style="color:var(--text-secondary); font-size:0.85rem; padding:6px 0;">フレンドがいません。</p>' : ''}
        ${friends.map(f => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; background: rgba(255,255,255,0.02); border-radius: 8px; margin-bottom: 6px;">
            <span style="font-size:0.85rem;">👤 ${escapeHtml(f)}</span>
            <button onclick="removeFriend('${escapeHtml(f)}')" style="background:none; border:1px solid #ff4949; color:#ff4949; font-size:0.75rem; padding:2px 8px; border-radius:9999px; cursor:pointer;">削除</button>
          </div>
        `).join('')}
      </div>

      <div>
        <div style="font-weight: bold; font-size: 0.9rem; color: var(--pink-color); margin-bottom: 8px; border-bottom: 1px solid var(--border-color); padding-bottom: 4px;">🚫 ブロック一覧 (${blockedUsers.length})</div>
        ${blockedUsers.length === 0 ? '<p style="color:var(--text-secondary); font-size:0.85rem; padding:6px 0;">ブロックしているユーザーはいません。</p>' : ''}
        ${blockedUsers.map(b => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; background: rgba(255,255,255,0.02); border-radius: 8px; margin-bottom: 6px;">
            <span style="font-size:0.85rem;">🚫 ${escapeHtml(b)}</span>
            <button onclick="unblockUser('${escapeHtml(b)}')" style="background:none; border:1px solid var(--text-secondary); color:var(--text-primary); font-size:0.75rem; padding:2px 8px; border-radius:9999px; cursor:pointer;">解除</button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

window.openChat = function(friendName) {
  closeModal('dmListModal');
  currentChatFriend = friendName;
  if (!dms[friendName]) dms[friendName] = [];

  let chatModal = document.getElementById('chatModal');
  if (!chatModal) {
    chatModal = document.createElement('div');
    chatModal.id = 'chatModal';
    chatModal.className = 'modal-overlay';
    document.body.appendChild(chatModal);
  }
  chatModal.style.display = 'flex';
  renderChatContent();
}

function renderChatContent() {
  const chatModal = document.getElementById('chatModal');
  const messages = dms[currentChatFriend] || [];

  chatModal.innerHTML = `
    <div class="modal-content" style="display: flex; flex-direction: column; height: 75vh; width: 95%; max-width: 450px; padding: 16px; background: var(--card-bg);">
      <div class="modal-title" style="padding-bottom: 12px; border-bottom: 1px solid var(--border-color); margin-bottom: 0;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>👤</span>
          <span>${escapeHtml(currentChatFriend)}</span>
        </div>
        <button onclick="closeModal('chatModal')" style="background:none; border:none; color:var(--text-primary); cursor:pointer; font-size: 1.1rem;">✕</button>
      </div>

      <div id="chatMessages" style="flex: 1; overflow-y: auto; background: var(--bg-color); padding: 12px; border-radius: 12px; margin: 12px 0; display: flex; flex-direction: column; gap: 12px; border: 1px solid var(--border-color);">
        ${messages.length === 0 ? '<div style="text-align:center; color:var(--text-secondary); margin:auto; font-size:0.85rem;">メッセージを送ってトークを開始しましょう！</div>' : ''}
        ${messages.map(m => {
          const isMe = m.sender === userProfile.name;
          return `
            <div style="display: flex; flex-direction: column; align-items: ${isMe ? 'flex-end' : 'flex-start'};">
              <div style="font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 2px;">${isMe ? '' : m.sender}</div>
              <div style="display: flex; align-items: flex-end; gap: 6px; flex-direction: ${isMe ? 'row-reverse' : 'row'}; max-width: 85%;">
                <div style="background: ${isMe ? '#00b900' : '#2f3336'}; color: white; padding: 8px 14px; border-radius: ${isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px'}; font-size: 0.9rem; line-height: 1.4; word-break: break-word;">
                  ${escapeHtml(m.text)}
                </div>
                <span style="font-size: 0.65rem; color: var(--text-secondary); white-space: nowrap;">${m.time}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <form onsubmit="sendDmMessage(event)" style="display: flex; gap: 8px;">
        <input type="text" id="dmInput" class="form-input" placeholder="メッセージを入力..." required style="margin:0; border-radius: 9999px; padding: 10px 16px;">
        <button type="submit" class="post-submit-btn" style="background: #00b900; padding: 0 18px;">送信</button>
      </form>
    </div>
  `;
  const msgBox = document.getElementById('chatMessages');
  msgBox.scrollTop = msgBox.scrollHeight;
}

window.sendDmMessage = function(e) {
  e.preventDefault();
  const input = document.getElementById('dmInput');
  const text = input.value.trim();
  if (!text || !currentChatFriend) return;

  const timeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  dms[currentChatFriend].push({ sender: userProfile.name, text, time: timeStr });
  saveLocalSettings();
  input.value = '';
  renderChatContent();
  playNotificationSound();
}

window.blockUser = function(userName) {
  if (confirm(`${userName} さんをブロックしますか？ ブロックした相手の投稿は非表示になります。`)) {
    if (!blockedUsers.includes(userName)) {
      blockedUsers.push(userName);
    }
    friends = friends.filter(f => f !== userName);
    pendingRequestsOut = pendingRequestsOut.filter(u => u !== userName);
    pendingRequestsIn = pendingRequestsIn.filter(r => r.from !== userName);
    
    saveLocalSettings();
    renderTweets();
    alert(`${userName} さんをブロックしました。`);
  }
}

window.onSearchInput = function(val) {
  searchQuery = val.trim().toLowerCase();
  clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
  renderTweets();
}

window.clearSearch = function() {
  searchQuery = '';
  searchInput.value = '';
  clearSearchBtn.style.display = 'none';
  renderTweets();
}

window.searchTag = function(tag) {
  searchInput.value = tag;
  window.onSearchInput(tag);
}

document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const newName = inputName.value.trim();
  if (!newName) return;

  if (newName !== userProfile.name) {
    const success = await claimUsername(newName);
    if (!success) {
      alert("❌ その名前は既に他の方が使用しています。別の名前にしてください。");
      return;
    }
  }

  userProfile.name = newName;
  userProfile.lang = inputLang.value;
  if (inputAvatarUrl.value) userProfile.avatar = inputAvatarUrl.value;

  const file = inputAvatarFile.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      userProfile.avatar = event.target.result;
      saveLocalSettings();
      updateProfileUI();
      if (typeof window.applyUI18n === 'function') {
        window.applyUI18n(userProfile.lang);
      }
      profileModal.style.display = 'none';
      renderTweets();
    };
    reader.readAsDataURL(file);
  } else {
    saveLocalSettings();
    updateProfileUI();
    if (typeof window.applyUI18n === 'function') {
      window.applyUI18n(userProfile.lang);
    }
    profileModal.style.display = 'none';
    renderTweets();
  }
});

window.translateTweet = async function(tweetId) {
  const tweet = tweets.find(t => t.id === tweetId);
  if (!tweet) return;

  if (tweet.translatedText) {
    tweet.translatedText = null;
    renderTweets();
    return;
  }

  const text = tweet.text;
  try {
    const srcLang = tweet.lang || 'en';
    const targetLang = userProfile.lang || 'ja';
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${srcLang}|${targetLang}`;
    
    const res = await fetch(url);
    const data = await res.json();
    
    if (data && data.responseData && data.responseData.translatedText) {
      tweet.translatedText = data.responseData.translatedText;
    } else {
      tweet.translatedText = '（翻訳結果を取得できませんでした）';
    }
  } catch (err) {
    tweet.translatedText = '（翻訳通信エラーが発生しました）';
  }
  renderTweets();
}

const mediaInput = document.getElementById('mediaInput') || document.getElementById('imageInput');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const previewWrapper = document.getElementById('previewWrapper');
const removeImageBtn = document.getElementById('removeImageBtn');

if (mediaInput) {
  mediaInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      alert("⚠️ 動画のアップロードはできません。\n画像またはGIFアニメーションのみ選択してください。");
      mediaInput.value = '';
      return;
    }

    if (file.size > 2000000) {
      alert("⚠️ 画像（またはGIF）のファイルサイズが大きすぎます（2MB以下にしてください）。");
      mediaInput.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      currentMediaBase64 = event.target.result;
      if (previewWrapper) {
        previewWrapper.innerHTML = `<img src="${currentMediaBase64}" alt="プレビュー" style="width: 100%; max-height: 200px; border-radius: 8px; object-fit: cover;">`;
      }
      if (imagePreviewContainer) imagePreviewContainer.style.display = 'block';
    };
    reader.readAsDataURL(file);
  });
}

if (removeImageBtn) {
  removeImageBtn.addEventListener('click', () => {
    currentMediaBase64 = '';
    if (mediaInput) mediaInput.value = '';
    if (previewWrapper) previewWrapper.innerHTML = '';
    if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function formatTweetText(text) {
  const escaped = escapeHtml(text);
  return escaped.replace(/(#[^\s#]+)/g, (match) => {
    return `<span class="hashtag-link" onclick="searchTag('${match}')">${match}</span>`;
  });
}

function renderTweets() {
  const tweetList = document.getElementById('tweetList');
  if (!tweetList) return;
  tweetList.innerHTML = '';

  const filteredTweets = tweets.filter(t => {
    if (blockedUsers.includes(t.name)) return false;
    if (currentFilterMode === 'bookmarks' && !bookmarks.includes(t.id)) return false;
    if (currentFilterMode === 'my_posts' && t.name !== userProfile.name) return false;
    if (!searchQuery) return true;
    const fullText = (t.name + ' ' + t.text).toLowerCase();
    return fullText.includes(searchQuery);
  });

  if (filteredTweets.length === 0) {
    let msg = '該当する投稿はありません';
    if (currentFilterMode === 'bookmarks') msg = 'ブックマークした投稿はありません 🔖';
    if (currentFilterMode === 'my_posts') msg = 'あなたの投稿はまだありません 👤';
    tweetList.innerHTML = `<p style="color: var(--text-secondary); text-align: center; padding: 40px;">${msg}</p>`;
    return;
  }

  filteredTweets.forEach(tweet => {
    const isFriend = friends.includes(tweet.name);
    const isPendingOut = pendingRequestsOut.includes(tweet.name);
    const isBookmarked = bookmarks.includes(tweet.id);
    const isMyTweet = (tweet.deviceId && tweet.deviceId === deviceId) || (!tweet.deviceId && tweet.name === userProfile.name);
    const r = tweet.reactions || { thanks: 0, peace: 0, celebrate: 0, healing: 0 };
    
    const peerTime = typeof window.getPeerCurrentTime === 'function' 
      ? window.getPeerCurrentTime(tweet.lang || 'en') 
      : (tweet.time || '');

    let friendActionHtml = '';
    if (!isMyTweet) {
      if (isFriend) {
        friendActionHtml = `<span style="font-size: 0.75rem; color: #00b900; font-weight:bold;">✔ フレンド</span>`;
      } else if (isPendingOut) {
        // 申請中の場合は「取り消し」ボタンを表示
        friendActionHtml = `<button onclick="cancelFriendRequest('${escapeHtml(tweet.name)}')" style="background: rgba(255, 73, 73, 0.15); border: 1px solid #ff4949; color: #ff4949; font-size: 0.75rem; padding: 2px 8px; border-radius: 9999px; cursor: pointer;" title="申請を取り消す">⏳ 取消</button>`;
      } else {
        friendActionHtml = `<button onclick="requestFriend('${escapeHtml(tweet.name)}')" style="background: rgba(29, 155, 240, 0.15); border: 1px solid var(--accent-color); color: var(--accent-color); font-size: 0.75rem; padding: 2px 8px; border-radius: 9999px; cursor: pointer;">✉️ 申請</button>`;
      }
    }

    let deleteBtnHtml = isMyTweet 
      ? `<button onclick="deleteTweet(${tweet.id}, '${tweet.deviceId || ''}')" style="background:none; border:1px solid #ff4949; color:#ff4949; font-size:0.7rem; padding:2px 8px; border-radius:9999px; cursor:pointer;" title="削除">🗑️ 削除</button>` 
      : '';

    let blockBtnHtml = !isMyTweet 
      ? `<button onclick="blockUser('${escapeHtml(tweet.name)}')" style="background:none; border:none; color:var(--text-secondary); font-size:0.75rem; cursor:pointer;" title="ブロック">🚫</button>` 
      : '';

    let mediaHtml = tweet.imageUrl ? `<img src="${tweet.imageUrl}" class="tweet-image" alt="添付画像" style="width: 100%; max-height: 350px; border-radius: 12px; object-fit: cover; margin-top: 8px;">` : '';

    const card = document.createElement('article');
    card.className = 'tweet-card';
    card.innerHTML = `
      <img class="user-avatar" src="${tweet.avatar || 'https://via.placeholder.com/40'}" alt="Avatar">
      <div class="tweet-content">
        <div class="tweet-header">
          <span class="tweet-author">${escapeHtml(tweet.name)}</span>
          <span class="tweet-meta">
            ${tweet.flag || '🌐'} 
            <span class="peer-world-time" data-lang="${tweet.lang || 'en'}">${peerTime}</span>
          </span>
          
          <div style="margin-left: auto; display: flex; gap: 8px; align-items: center;">
            ${friendActionHtml}
            ${deleteBtnHtml}
            <button onclick="toggleBookmark(${tweet.id})" style="background:none; border:none; color:${isBookmarked ? 'var(--accent-color)' : 'var(--text-secondary)'}; font-size:0.9rem; cursor:pointer;" title="ブックマーク">
              ${isBookmarked ? '🔖' : '🏷️'}
            </button>
            ${blockBtnHtml}
          </div>
        </div>
        <div class="tweet-text">${formatTweetText(tweet.text)}</div>
        
        ${tweet.lang && tweet.lang !== userProfile.lang ? `
          <button class="translate-link" onclick="translateTweet(${tweet.id})">
            🌐 ${tweet.translatedText ? '元のテキストを表示' : '翻訳を表示 (無料/無制限)'}
          </button>
        ` : ''}

        ${tweet.translatedText ? `
          <div class="translated-box">
            <strong>翻訳 (${userProfile.lang.toUpperCase()}):</strong><br>${formatTweetText(tweet.translatedText)}
          </div>
        ` : ''}

        ${mediaHtml}
        
        <div style="display: flex; gap: 6px; margin: 8px 0; flex-wrap: wrap;">
          <button onclick="toggleReaction(${tweet.id}, 'thanks')" style="background: ${tweet.userReaction === 'thanks' ? 'rgba(249, 24, 128, 0.2)' : 'rgba(255,255,255,0.04)'}; border: 1px solid ${tweet.userReaction === 'thanks' ? 'var(--pink-color)' : 'var(--border-color)'}; color: var(--text-primary); font-size: 0.75rem; padding: 3px 8px; border-radius: 9999px; cursor: pointer;">
            🌸 感謝 ${r.thanks ? r.thanks : ''}
          </button>
          <button onclick="toggleReaction(${tweet.id}, 'peace')" style="background: ${tweet.userReaction === 'peace' ? 'rgba(29, 155, 240, 0.2)' : 'rgba(255,255,255,0.04)'}; border: 1px solid ${tweet.userReaction === 'peace' ? 'var(--accent-color)' : 'var(--border-color)'}; color: var(--text-primary); font-size: 0.75rem; padding: 3px 8px; border-radius: 9999px; cursor: pointer;">
            🕊️ 平和 ${r.peace ? r.peace : ''}
          </button>
          <button onclick="toggleReaction(${tweet.id}, 'celebrate')" style="background: ${tweet.userReaction === 'celebrate' ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255,255,255,0.04)'}; border: 1px solid ${tweet.userReaction === 'celebrate' ? '#ffd700' : 'var(--border-color)'}; color: var(--text-primary); font-size: 0.75rem; padding: 3px 8px; border-radius: 9999px; cursor: pointer;">
            🎉 お祝い ${r.celebrate ? r.celebrate : ''}
          </button>
          <button onclick="toggleReaction(${tweet.id}, 'healing')" style="background: ${tweet.userReaction === 'healing' ? 'rgba(0, 185, 0, 0.2)' : 'rgba(255,255,255,0.04)'}; border: 1px solid ${tweet.userReaction === 'healing' ? '#00b900' : 'var(--border-color)'}; color: var(--text-primary); font-size: 0.75rem; padding: 3px 8px; border-radius: 9999px; cursor: pointer;">
            ☕ 癒やし ${r.healing ? r.healing : ''}
          </button>
        </div>

        <div class="tweet-footer">
          <button class="tweet-action" onclick="toggleReply(${tweet.id})">
            <i data-lucide="message-circle" style="width: 16px;"></i>
            <span>${tweet.replies ? tweet.replies.length : 0}</span>
          </button>
          <button class="tweet-action ${tweet.isLiked ? 'liked' : ''}" onclick="toggleLike(${tweet.id})">
            <i data-lucide="heart" style="width: 16px; ${tweet.isLiked ? 'fill: var(--pink-color);' : ''}"></i>
            <span>${tweet.likes}</span>
          </button>
        </div>

        <div id="replies-${tweet.id}" class="replies-container">
          <div id="reply-list-${tweet.id}">
            ${(tweet.replies || []).map(r => `
              <div class="reply-item">
                <strong>${escapeHtml(r.name)}:</strong>
                <span>${formatTweetText(r.text)}</span>
              </div>
            `).join('')}
          </div>
          <form class="reply-form" onsubmit="addReply(event, ${tweet.id})">
            <input type="text" class="reply-input" placeholder="返信する..." required>
            <button type="submit" class="reply-btn">返信</button>
          </form>
        </div>
      </div>
    `;
    tweetList.appendChild(card);
  });

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function addNotification(text) {
  notifications.unshift({ text, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) });
  saveLocalSettings();
  updateNotificationBadge();
  playNotificationSound();
}

window.clearNotifications = function() {
  notifications = [];
  pendingRequestsIn = [];
  saveLocalSettings();
  updateNotificationBadge();
  renderNotifications();
}

function renderNotifications() {
  const list = document.getElementById('notificationList');
  if (!list) return;

  let html = `
    <div style="display: flex; justify-content: flex-end; margin-bottom: 8px;">
      <button onclick="clearNotifications()" style="background: none; border: 1px solid var(--border-color); color: var(--text-secondary); font-size: 0.75rem; padding: 4px 10px; border-radius: 9999px; cursor: pointer;">通知をすべてクリア</button>
    </div>
  `;

  if (notifications.length === 0 && pendingRequestsIn.length === 0) {
    list.innerHTML = html + `<p style="color: var(--text-secondary); text-align: center; padding: 20px;">通知はありません</p>`;
    return;
  }

  if (pendingRequestsIn.length > 0) {
    html += `
      <div style="margin-bottom: 16px; background: rgba(29, 155, 240, 0.1); border: 1px solid var(--accent-color); padding: 12px; border-radius: 12px;">
        <div style="font-weight: bold; font-size: 0.9rem; color: var(--accent-color); margin-bottom: 8px;">📩 届いているフレンド申請 (${pendingRequestsIn.length})</div>
        ${pendingRequestsIn.map(r => `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size:0.85rem; font-weight:bold;">👤 ${escapeHtml(r.from)}</span>
            <div style="display:flex; gap:6px;">
              <button onclick="acceptFriend('${escapeHtml(r.from)}')" style="background: #00b900; border:none; color:white; font-size:0.75rem; padding:4px 10px; border-radius:9999px; cursor:pointer; font-weight:bold;">承認</button>
              <button onclick="rejectFriend('${escapeHtml(r.from)}')" style="background:transparent; border:1px solid var(--text-secondary); color:var(--text-secondary); font-size:0.75rem; padding:4px 8px; border-radius:9999px; cursor:pointer;">拒否</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  html += notifications.map(n => `
    <div class="notification-item">
      <span>🔔</span>
      <div style="flex: 1;">
        <div>${escapeHtml(n.text)}</div>
        <div style="font-size: 0.75rem; color: var(--text-secondary);">${n.time}</div>
      </div>
    </div>
  `).join('');

  list.innerHTML = html;
}

window.toggleLike = async function(id) {
  const tweet = tweets.find(t => t.id === id);
  if (tweet) {
    tweet.isLiked = !tweet.isLiked;
    tweet.likes += tweet.isLiked ? 1 : -1;
    if (tweet.isLiked && tweet.name !== userProfile.name) {
      addNotification(`${userProfile.name} さんがあなたの投稿にいいねしました ❤️`);
    }
    await updateTweetInFirestore(tweet);
  }
}

window.toggleReply = function(id) {
  const el = document.getElementById(`replies-${id}`);
  if (el) el.style.display = el.style.display === 'block' ? 'none' : 'block';
}

window.addReply = async function(e, id) {
  e.preventDefault();
  const input = e.target.querySelector('.reply-input');
  const text = input.value;
  const tweet = tweets.find(t => t.id === id);
  if (tweet && text) {
    if (!tweet.replies) tweet.replies = [];
    tweet.replies.push({ name: userProfile.name, text });
    if (tweet.name !== userProfile.name) {
      addNotification(`${userProfile.name} さんがあなたの投稿に返信しました: "${text}"`);
    }
    input.value = '';
    await updateTweetInFirestore(tweet);
    const replyContainer = document.getElementById(`replies-${id}`);
    if (replyContainer) replyContainer.style.display = 'block';
  }
}

const tweetForm = document.getElementById('tweetForm');
if (tweetForm) {
  tweetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const tweetText = document.getElementById('tweetText');
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    const newTweet = {
      id: Date.now(),
      deviceId: deviceId,
      name: userProfile.name,
      avatar: userProfile.avatar,
      text: tweetText.value,
      lang: userProfile.lang,
      flag: userProfile.flag,
      time: timeStr,
      imageUrl: currentMediaBase64,
      likes: 0,
      isLiked: false,
      reactions: { thanks: 0, peace: 0, celebrate: 0, healing: 0 },
      userReaction: null,
      translatedText: null,
      replies: []
    };

    try {
      await db.collection('tweets').doc(String(newTweet.id)).set(newTweet);
      
      tweetText.value = '';
      currentMediaBase64 = '';
      if (mediaInput) mediaInput.value = '';
      if (previewWrapper) previewWrapper.innerHTML = '';
      if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';

      if (typeof confetti === 'function') {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      console.error("投稿エラー: ", err);
      alert("画像のファイルサイズが大きすぎるため投稿できませんでした。もっと軽い画像をお試しください。");
    }
  });
}

checkInitialSetup();

if (typeof window.applyUI18n === 'function') {
  window.applyUI18n(userProfile.lang);
}
