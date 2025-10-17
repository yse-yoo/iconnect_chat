// サーバーに接続
const socket = io("http://localhost:3000", { transports: ["websocket"] });

// 固定ルーム（簡易）
const roomId = "room1";
const username = "User" + Math.floor(Math.random() * 1000);

// 接続時
socket.on("connect", () => {
  console.log("🟢 Connected:", socket.id);
  append(`✅ 接続しました (${username})`, "system");
  socket.name = username;
  socket.emit("join_room", { roomId }); // ルーム参加（もし対応していれば）
});

// メッセージ受信
socket.on("chat_message", (data) => {
  append(`${data.from ?? "匿名"}: ${data.text}`, "remote");
});

// エラーメッセージ
socket.on("error_message", (msg) => append(msg, "error"));

// ==============================
// 送信処理
// ==============================
const form = document.getElementById("chatForm");
const input = document.getElementById("msgInput");
const chatBox = document.getElementById("chatBox");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  // 自分のチャットログに表示
  append(`🟢 あなた: ${text}`, "self");

  // サーバーに送信
  socket.emit("send_message", { text, roomId });
  input.value = "";
});

// ==============================
// 表示関数
// ==============================
function append(msg, type = "") {
  const div = document.createElement("div");
  div.textContent = msg;

  div.className =
    "p-2 rounded mb-2 text-sm " +
    (type === "self"
      ? "bg-blue-100 text-right"
      : type === "remote"
      ? "bg-green-100 text-left"
      : type === "error"
      ? "bg-red-100 text-red-600"
      : "text-gray-500 italic");

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}