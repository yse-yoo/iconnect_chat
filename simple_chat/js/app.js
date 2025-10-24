if (typeof HOST === "undefined") {
    alert("HOSTをenv.jsで設定してください");
}
// SpeechSynthesisUtterance をグローバルに1つだけ作成
const uttr = new SpeechSynthesisUtterance();

// TTSキャッシュ
const ttsCache = {};

// サーバーに接続
const socket = io(HOST, { transports: ["websocket"] });

// 固定ルーム（簡易）
const roomId = "room1";
const userName = "User" + Math.floor(Math.random() * 1000);

const langSelect = document.getElementById("lang-select");

// 接続時
socket.on("connect", () => {
    console.log("🟢 Connected:", socket.id);
    append(`✅ Connected (${userName})`, "system");
    socket.name = userName;
    socket.emit("join_room", { roomId, userName });
});

// JOINメッセージ受信
socket.on("join_message", (data) => {
    append(data.text, "system");
});

// メッセージ受信
socket.on("chat_message", async (data) => {
    const toLang = langSelect.value;
    const fromLang = data.lang || "auto";

    // オリジナルテキスト
    let text = data.text;
    append(`${data.from}: ${text}`, "remote", text, toLang);

    // 翻訳
    let loadingElem;
    if (toLang === fromLang) {
        return;
    } else {
        loadingElem = appendLoading();
        try {
            const converted = await translateText(data.text, fromLang, toLang);
            if (converted && typeof converted === "string") {
                append(`${data.from}: ${converted}`, "remote");
            } else {
                append("⚠️ Translate failed", "system");
            }
        } catch (e) {
            append("⚠️ Translate error", "system");
        } finally {
            // ローディング削除
            if (loadingElem) loadingElem.remove();
        }
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

    // 🚫 文字数制限
    if (text.length > 100) {
        alert("100文字以内で入力してください。");
        return;
    }

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
function append(msg, type = "", speakText = "", langValue = "") {
    const div = document.createElement("div");
    div.className = "flex items-center justify-between mb-2";

    // 表示用テキスト
    const textDiv = document.createElement("div");
    textDiv.textContent = msg;

    const classMap = {
        self: "bg-blue-100 text-right",
        system: "bg-white text-left",
        remote: "bg-green-100 text-left",
        error: "bg-red-100 text-red-600",
        default: "text-gray-500 italic"
    };

    const baseClass = "p-2 rounded text-sm flex-1";
    const typeClass = classMap[type] || classMap.default;
    textDiv.className = `${baseClass} ${typeClass}`;

    // ✅ dataset へ本文だけ保存
    textDiv.dataset.speak = speakText;
    div.appendChild(textDiv);

    // 🔊 再生ボタン
    if (speakText && langValue) {
        const btn = document.createElement("button");
        btn.innerHTML = "🔊";
        btn.className = "ml-2 px-2 py-1 text-sm border rounded bg-gray-200 hover:bg-gray-300";
        btn.dataset.loading = "false";

        btn.addEventListener("click", () => {
            const voiceId = langSelect.options[langSelect.selectedIndex].dataset.voice;
            speak(textDiv.dataset.speak, langValue, voiceId, btn);
        });

        div.appendChild(btn);
    }

    // チャットボックスに追加
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

function hashKey(text, lang) {
    return btoa(encodeURIComponent(text + "_" + lang));
}

// 翻訳中に表示する行（optional）
function appendLoading() {
    const div = document.createElement("div");
    div.className = "p-2 rounded text-sm bg-yellow-50 border border-yellow-200 text-yellow-600 italic";
    div.textContent = "⏳ 翻訳中...";
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
    return div;
}

// ==============================
// 読み上げ関数
// ==============================
// function speak(text, lang) {
//     uttr.lang = lang;
//     uttr.rate = 1;   // 読み上げ速度（0.5〜2）
//     uttr.pitch = 1;  // ピッチ（0〜2）
//     uttr.volume = 1; // 音量（0〜1）
//     uttr.text = text;
//     speechSynthesis.speak(uttr);
// }

async function speak(text, lang, voiceId, btn) {
    const key = hashKey(text, lang);

    // キャッシュ再生
    if (ttsCache[key]) {
        console.log("🔁 Play from cache");
        new Audio(ttsCache[key]).play();
        return;
    }

    // 🔄 ローディングON
    btn.disabled = true;
    btn.innerHTML = `
      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-800"></div>
    `;

    // API
    const response = await fetch(`${HOST}/api/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang, voiceId })
    });

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    // キャッシュ
    ttsCache[key] = url;

    // ✅ UI戻す
    btn.disabled = false;
    btn.innerHTML = "🔊";

    new Audio(url).play();
}