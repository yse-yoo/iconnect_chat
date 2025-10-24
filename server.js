// WebSocket
import { Server } from "socket.io";
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import crypto from "crypto";
import fs from "fs";
import path from "path";

import { GoogleGenAI } from "@google/genai";

const HOST = process.env.HOST || "localhost";
const PORT = process.env.PORT || 3000;

let voiceId = "";

// ==============================
// 🔥 Express for REST API
// ==============================
const app = express();
app.use(express.json());
app.use(cors());

// ==============================
// ✅ Gemini 設定
// ==============================
const modelName = "gemini-2.0-flash";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ==============================
// 翻訳API: /translate
// ==============================
app.post("/api/translate", async (req, res) => {
    const { text, fromLang, toLang } = req.body;

    if (!text || !fromLang || !toLang) {
        return res.status(400).json({
            error: "text, fromLang, and toLang are required.",
        });
    }
    try {
        const translatedText = await aiTranslate(text, fromLang, toLang);
        console.log("🌐 Translated:", translatedText);
        res.json({ text, translatedText, fromLang, toLang });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "translated error" });
    }
});


// ------------------------------
// HTTPサーバーを起動
// ------------------------------
const httpServer = app.listen(PORT, () => {
    console.log(`✅ Translate API ready : http://${HOST}:${PORT}`);
});

// ==============================
// Socket.IO (HTTPサーバーに乗せる)
// ==============================
const io = new Server(httpServer, {
    cors: { origin: "*" },
});

// ==============================
// WebSocket本体
// ==============================
io.on("connection", (socket) => {
    console.log("🟢 New connection:", socket.id);

    socket.on("join_room", ({ roomId, userName }) => {
        console.log(`➡️ ${userName} joining room:`, roomId);
        socket.join(roomId);
        socket.name = userName;

        // 参加メッセージをルームに通知
        socket.to(roomId).emit("join_message", {
            from: "system",
            text: `${socket.name} joined the room.`,
        });
    });

    socket.on("send_message", ({ text, roomId, lang }) => {
        if (!roomId) {
            socket.emit("error_message", "⚠️ Room is not connected.");
            return;
        }
        console.log(`💬 Message from ${socket.name}:`, text);
        socket.to(roomId).emit("chat_message", { from: socket.name, text, lang });
    });

    socket.on("disconnect", () => {
        console.log(`🔴 Disconnected: ${socket.name ?? socket.id}`);
    });
});

export async function aiTranslate(text, fromLang, toLang) {
    if (!text || typeof text !== "string") {
        return null;
    }

    // 最大文字数制限（サーバー負荷保護）
    if (text.length > 100) {
        return null;
    }

    try {
        const prompt = `
            Translate the following text from ${fromLang} to ${toLang}.
            Only output the translation.
            No explanations.
            ${text}`;

        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

        const response = await ai.models.generateContent({
            model: modelName,
            config: { maxOutputTokens: 512 },
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        const result =
            response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!result) throw "Empty result";
        return result;

    } catch (err) {
        console.error("[AI翻訳失敗]", err);
        return null; // ← UI側で判定しやすい
    }
}

// ==============================
// ElevenLabs TTS API
// ==============================
app.post("/api/tts", async (req, res) => {
    const { text, lang, voiceId } = req.body;
    if (!text || !lang || !voiceId) {
        return res.status(400).json({
            error: "text, lang, and voiceId are required.",
        });
    }

    // ハッシュ生成（text+lang）
    const hash = crypto.createHash("md5").update(text + lang).digest("hex");
    const filePath = path.join("tts-cache", `${hash}.mp3`);

    // ✅ もしファイルが存在したらキャッシュ返却
    if (fs.existsSync(filePath)) {
        console.log("🟠 Cache hit:", filePath);

        const data = fs.readFileSync(filePath);
        res.setHeader("Content-Type", "audio/mpeg");
        return res.send(data);
    }

    console.log("🟢 Cache miss → ElevenLabs API");

    // ===========================
    //  ElevenLabs API 呼び出し
    // ===========================
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "xi-api-key": process.env.ELEVEN_API_KEY,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            text,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
                stability: 0.3,
                similarity_boost: 0.8
            }
        })
    });
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ✅ サーバーに保存（キャッシュ登録）
    fs.writeFileSync(filePath, buffer);

    // レスポンス返却
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(buffer);
});