    const socket = io("http://localhost:3000", { transports: ["websocket"] });

    const chatBox = document.getElementById("chatBox");
    const form = document.getElementById("form");
    const input = document.getElementById("input");
    const status = document.getElementById("status");

    const append = (msg, cls = "") => {
      const div = document.createElement("div");
      div.className = cls + " mb-1";
      div.textContent = msg;
      chatBox.appendChild(div);
      chatBox.scrollTop = chatBox.scrollHeight;
    };

    // 接続
    socket.on("connect", () => {
      status.textContent = "✅ 接続完了";
      socket.emit("register", {
        user_id: CURRENT_USER_ID,
        name: CURRENT_USER_NAME,
        from_lang: CURRENT_LANG,
      });

      if (ROOM_ID) {
        socket.emit("join_room", { roomId: ROOM_ID });
        append(`📡 ルーム (${ROOM_ID}) に参加しました`, "text-gray-600");
      }
    });

    // ルーム参加確認
    socket.on("room_joined", ({ roomId, members }) => {
      append(`🤝 ルーム ${roomId} に参加中 (${members.length}人)`, "text-green-600");
    });

    // メッセージ受信
    socket.on("chat_message", ({ from, text }) => {
      append(`💬 ${from}: ${text}`, "text-gray-800");
    });

    // メッセージ送信
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text || !ROOM_ID) return;
      append(`🧑 ${CURRENT_USER_NAME}: ${text}`, "text-blue-700");
      socket.emit("send_message", { roomId: ROOM_ID, text });
      input.value = "";
    });