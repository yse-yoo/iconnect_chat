if (typeof HOST === "undefined") {
    alert("HOSTをenv.jsで設定してください");
}
// サーバーに接続
const socket = io(HOST, { transports: ["websocket"] });

// 固定ルーム（簡易）
const roomId = "room1";
const username = "User" + Math.floor(Math.random() * 1000);

const langSelect = document.getElementById("lang-select");

// 接続時
socket.on("connect", () => {
    console.log("🟢 Connected:", socket.id);
    append(`✅ Connected (${username})`, "system");
    socket.name = username;
    socket.emit("join_room", { roomId }); // ルーム参加（もし対応していれば）
});

// JOINメッセージ受信
socket.on("join_message", (data) => {
    append(data.text, "system");
});

// メッセージ受信
socket.on("chat_message", (data) => {
    append(`${data.from ?? "anonymouse"}: ${data.text}`, "remote");
    console.log("💬 Received message:", data);
    // 言語指定
    const fromLang = data.lang;
    const toLang = langSelect.value;

    console.log(`🌐 Translating from ${fromLang} to ${toLang}`);

    if (fromLang === toLang) {
        // 同じ言語ならそのまま読み上げ
        speak(data.text, toLang);
        return;
    } else {
        // 翻訳
        translateText(data.text, fromLang, toLang).then(translated => {
            // 翻訳結果を表示
            append(`🔄 Translated: ${translated}`, "remote");
            // 🔊 読み上げ
            speak(translated, toLang);
        });
    }
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

    // 言語選択取得
    const myLang = langSelect.value;
    console.log(`🌐 My language: ${myLang}`);

    // サーバーに送信
    socket.emit("send_message", { text, roomId, lang: myLang });
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

function translateText(text, fromLang, toLang) {
    return fetch(`${HOST}/api/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, fromLang, toLang })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            return data.translatedText;
        });
}

// ==============================
// 読み上げ関数
// ==============================
function speak(text, lang) {
    const uttr = new SpeechSynthesisUtterance(text);
    uttr.lang = lang;
    uttr.rate = 1;   // 読み上げ速度（0.5〜2）
    uttr.pitch = 1;  // ピッチ（0〜2）
    uttr.volume = 1; // 音量（0〜1）
    speechSynthesis.speak(uttr);
}