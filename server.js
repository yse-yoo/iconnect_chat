// server.js
import { Server } from "socket.io";

const io = new Server(3000, { cors: { origin: "*" } });

// ==============================
// データ構造
// ==============================
const users = new Map(); // user_id → { socket, name, lang }
const rooms = new Map(); // room_id → Set(socket.id)

// ==============================
// 接続時
// ==============================
io.on("connection", (socket) => {
  console.log("🟢 New connection:", socket.id);

  // ==============================
  // 登録
  // ==============================
  socket.on("register", (user) => {
    socket.user_id = user.user_id;
    socket.name = user.name;
    socket.lang = user.from_lang;
    users.set(user.user_id, { ...user, socket });
    console.log(`👤 Registered: ${user.name} (${user.user_id})`);
  });

  // ==============================
  // ルーム参加（URLベース）
  // ==============================
  socket.on("join_room", ({ roomId }) => {
    if (!roomId) {
      socket.emit("error_message", "⚠️ ルームIDが指定されていません。");
      return;
    }

    socket.join(roomId);

    if (!rooms.has(roomId)) rooms.set(roomId, new Set());
    rooms.get(roomId).add(socket.id);

    const members = Array.from(rooms.get(roomId)).map((id) => {
      const member = [...users.values()].find((u) => u.socket.id === id);
      return member ? member.name : "Unknown";
    });

    console.log(`🏠 ${socket.name} joined ${roomId} (${members.length}人)`);

    // 現在の参加者リストを送信
    io.to(roomId).emit("room_joined", {
      roomId,
      members,
    });

    // 他の参加者に通知
    socket.to(roomId).emit("chat_message", {
      from: "🟢 System",
      text: `${socket.name} さんが参加しました！`,
    });
  });

  // ==============================
  // メッセージ送受信
  // ==============================
  socket.on("send_message", ({ text, roomId }) => {
    if (!roomId) {
      socket.emit("error_message", "⚠️ ルームが未接続です。");
      return;
    }
    console.log(`💬 Message from ${socket.name} in ${roomId}: ${text}`);
    socket.to(roomId).emit("chat_message", { from: socket.name, text });
  });

  // ==============================
  // 切断処理
  // ==============================
  socket.on("disconnect", () => {
    console.log(`🔴 Disconnected: ${socket.name ?? socket.id}`);

    // すべてのルームから削除
    for (const [roomId, members] of rooms.entries()) {
      if (members.has(socket.id)) {
        members.delete(socket.id);
        io.to(roomId).emit("chat_message", {
          from: "🔴 System",
          text: `${socket.name ?? "匿名ユーザー"} さんが退出しました。`,
        });
        if (members.size === 0) {
          rooms.delete(roomId);
          console.log(`🗑️ Room ${roomId} removed (empty)`);
        }
      }
    }

    // ユーザーリストから削除
    if (socket.user_id) users.delete(socket.user_id);
  });
});

console.log("✅ Socket.io server running on http://localhost:3000");
