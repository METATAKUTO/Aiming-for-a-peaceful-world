// アイコン初期化
lucide.createIcons();

// サンプル初期データ（画像なしの例）
let messages = [
  { id: 1, name: 'あや', country: '日本', text: 'みんなが笑顔で過ごせる毎日になりますように！', imageUrl: '', likes: 12 },
  { id: 2, name: 'Alex', country: 'アメリカ', text: 'Peace begins with a smile. 😊', imageUrl: '', likes: 8 }
];

const flowers = ['🌸', '🌺', '🌻', '🌼', '🌷', '🌹', '💐'];

const form = document.getElementById('messageForm');
const messageList = document.getElementById('messageList');
const flowerGarden = document.getElementById('flowerGarden');
const totalCountEl = document.getElementById('totalCount');
const refreshBtn = document.getElementById('refreshBtn');

let chart;

// 画面のレンダリング
function render() {
  // メッセージ描画（画像がある場合のみ <img> タグを表示する仕組みを追加）
  messageList.innerHTML = messages.map(msg => `
    <div class="msg-item">
      <div class="msg-header">
        <span class="msg-author">${escapeHtml(msg.name)} (${escapeHtml(msg.country)})</span>
      </div>
      <div class="msg-body">
        <p>${escapeHtml(msg.text)}</p>
        ${msg.imageUrl ? `<div class="msg-img-container"><img src="${msg.imageUrl}" alt="投稿画像" class="msg-img"></div>` : ''}
      </div>
      <div class="msg-footer">
        <button class="like-btn" onclick="addLike(${msg.id})">
          ❤️ ${msg.likes}
        </button>
      </div>
    </div>
  `).join('');

  // ガーデン描画
  flowerGarden.innerHTML = messages.map((_, i) => `
    <span class="flower">${flowers[i % flowers.length]}</span>
  `).join('');

  totalCountEl.textContent = messages.reduce((acc, m) => acc + 1 + m.likes, 0);

  updateChart();
}

// グラフ描画
function updateChart() {
  const countryCounts = {};
  messages.forEach(m => {
    countryCounts[m.country] = (countryCounts[m.country] || 0) + 1;
  });

  const ctx = document.getElementById('peaceChart').getContext('2d');
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(countryCounts),
      datasets: [{
        data: Object.values(countryCounts),
        backgroundColor: ['#f472b6', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right' }
      }
    }
  });
}

window.addLike = function(id) {
  const msg = messages.find(m => m.id === id);
  if (msg) {
    msg.likes++;
    render();
  }
};

// フォーム送信（画像ファイルの読み込み処理を追加）
form.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const name = document.getElementById('username').value;
  const country = document.getElementById('country').value;
  const text = document.getElementById('message').value;
  const imageFileinput = document.getElementById('imageFile');

  // 画像が選択されている場合の処理
  if (imageFileinput.files && imageFileinput.files[0]) {
    const file = imageFileinput.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
      const imageUrl = event.target.result; // 画像のデータURL
      saveMessage(name, country, text, imageUrl);
    };

    reader.readAsDataURL(file);
  } else {
    // 画像がない場合
    saveMessage(name, country, text, '');
  }
});

function saveMessage(name, country, text, imageUrl) {
  const newMsg = {
    id: Date.now(),
    name,
    country,
    text,
    imageUrl,
    likes: 0
  };

  messages.unshift(newMsg);
  render();
  form.reset();

  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 }
  });
}

refreshBtn.addEventListener('click', render);

function escapeHtml(str) {
  return str.replace(/[&< me>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
}

render();