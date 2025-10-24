// WebSocket
import { Server } from "socket.io";
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const HOST = process.env.HOST || "localhost";
const PORT = process.env.PORT || 3000;

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

    socket.on("join_room", ({ roomId, name }) => {
        socket.join(roomId);
        socket.name = name || `User-${socket.id.slice(0, 5)}`;

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
    const prompt = `
        Translate the following text from ${fromLang} to ${toLang}.
        Return only the translated text.
        Do not repeat the original sentence.
        No explanations, no comments, no quotes.

        ${text}`;

    console.log("🌐 Gemini Prompt:", text, fromLang, toLang);

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const contents = [
        {
            role: "user",
            parts: [{ text: prompt }],
        },
    ];

    const response = await ai.models.generateContent({
        model: modelName,
        config: { maxOutputTokens: 1024 },
        contents,
    });

    // console.log("🌐 Gemini Response:", response);

    try {
        const text = response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        return text;
    } catch (err) {
        console.error("🌐 Gemini Error:", err);
        return "error";
    }
}