// WebSocket
import { Server } from "socket.io";
import dotenv from "dotenv";
dotenv.config();

const HOST = process.env.HOST || "localhost";
const PORT = process.env.PORT || 3000;

const io = new Server(PORT, { cors: { origin: "*" } });

// ==============================
// 接続時
// ==============================
io.on("connection", (socket) => {
  console.log("🟢 New connection:", socket.id);

  // ==============================
  // ルーム参加
  // ==============================
  socket.on("join_room", ({ roomId, name }) => {
    socket.join(roomId);
    socket.name = name || `User-${socket.id.slice(0, 5)}`;
    console.log(`🚪 ${socket.name} joined room ${roomId}`);

    socket.to(roomId).emit("join_message", {
      from: "system",
      text: `${socket.name} が参加しました。`,
    });
  });

  // ==============================
  // メッセージ送受信
  // ==============================
  socket.on("send_message", ({ text, roomId }) => {
    console.log(`💬 Message from ${roomId}: ${text}`);
    if (!roomId) {
      socket.emit("error_message", "⚠️ ルームが未接続です。");
      return;
    }
    socket.to(roomId).emit("chat_message", { from: socket.name, text });
  });

  // ==============================
  // 切断処理
  // ==============================
  socket.on("disconnect", () => {
    console.log(`🔴 Disconnected: ${socket.name ?? socket.id}`);
  });
});

console.log(`✅ http://${HOST}:${PORT}`);