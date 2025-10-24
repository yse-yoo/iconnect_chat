if (typeof HOST === "undefined") {
    alert("HOSTをenv.jsで設定してください");
}
// サーバーに接続
const socket = io(HOST, { transports: ["websocket"] });

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

// JOINメッセージ受信
socket.on("join_message", (data) => {
    append(data.text, "system");
});

// メッセージ受信
socket.on("chat_message", (data) => {
    append(`${data.from ?? "匿名"}: ${data.text}`, "remote");
    console.log("💬 Received message:", data);
    // 🔊 読み上げ
    // 言語指定
    const lang = "ja-JP"; 
    speak(data.text, lang); 
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
    append(`🟢 ${text}`, "self");

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

    const classMap = {
        self: "bg-blue-100 text-right",
        system: "bg-white text-left",
        remote: "bg-green-100 text-left",
        error: "bg-red-100 text-red-600",
        default: "text-gray-500 italic"
    };

    const baseClass = "p-2 rounded mb-2 text-sm";
    const typeClass = classMap[type] || classMap.default;

    div.className = `${baseClass} ${typeClass}`;

    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// ==============================
// 読み上げ関数
// ==============================
function speak(text, lang = "ja-JP") {
    const uttr = new SpeechSynthesisUtterance(text);
    uttr.lang = lang;
    uttr.rate = 1;   // 読み上げ速度（0.5〜2）
    uttr.pitch = 1;  // ピッチ（0〜2）
    uttr.volume = 1; // 音量（0〜1）
    speechSynthesis.speak(uttr);
}