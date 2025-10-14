// Socket.io サーバーに接続
const socket = io("http://localhost:3000", { transports: ["websocket"] });

// 要素の取得
const nameInput = document.getElementById("name");
const fromInput = document.getElementById("from_lang");
const toInput = document.getElementById("to_lang");
const startBtn = document.getElementById("startBtn");
const chatArea = document.getElementById("chatArea");
const chatBox = document.getElementById("chatBox");
const form = document.getElementById("form");
const input = document.getElementById("input");

let username = "";
let from_lang = "";
let to_lang = "";

// チャットログに追加
function append(msg, cls = "") {
  const div = document.createElement("div");
  div.className = cls + " mb-1";
  div.textContent = msg;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// 接続時
socket.on("connect", () => {
  console.log("Connected:", socket.id);

  // 自分の user_id 名前 言語を登録
  socket.emit("register", {
    user_id: CURRENT_USER_ID,
    name: CURRENT_USER_NAME,
    from_lang: CURRENT_LANG,
  });
});

// 相手を選んだらマッチングリクエスト送信
const startChat = function (friendId, friendName) {
  append(`📨 ${friendName} にチャットリクエスト送信...`, "text-gray-600");
  socket.emit("invite_user", { target_id: friendId });
}

// 招待を受けた側
socket.on("invite_received", ({ from_id, from_name }) => {
  const ok = confirm(`💬 ${from_name} さんからチャットリクエストがあります。参加しますか？`);
  if (ok) socket.emit("accept_invite", { from_id });
});

// ペア成立
socket.on("paired", ({ partnerName }) => {
  append(`🤝 ${partnerName} さんと接続しました！`, "text-green-600");
});

// ペアリング待機
socket.on("waiting", (msg) => {
  append(msg, "text-gray-500 italic");
});

// メッセージ送信
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  socket.emit("send_message", { text });
  append(`🧑 ${CURRENT_USER_NAME}: ${text}`, "text-blue-700");
});

// メッセージ受信
socket.on("chat_message", ({ from, text }) => {
  append(`💬 ${from}: ${text}`, "text-gray-800");
});


// エラー受信
socket.on("error_message", (err) => {
  append(`⚠️ ${err}`, "text-red-600");
});