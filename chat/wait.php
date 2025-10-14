<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit;
}
$user_id = $_SESSION['user_id'];
$name = $_SESSION['name'];
$lang = $_SESSION['lang'];
?>
<!DOCTYPE html>
<html lang="ja">

<head>
    <meta charset="UTF-8">
    <title>📡 チャット待機中</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
</head>

<body class="bg-gray-100 flex flex-col items-center justify-center min-h-screen">
    <h2 class="text-2xl font-bold text-blue-600 mb-2">📡 チャット待機中...</h2>
    <p class="text-gray-600 mb-6">ユーザー: <?= htmlspecialchars($name) ?> (<?= htmlspecialchars($lang) ?>)</p>
    <div id="log" class="bg-white border rounded p-4 w-80 text-left h-60 overflow-y-auto shadow"></div>

    <script>
        const socket = io("http://localhost:3000", {
            transports: ["websocket"]
        });
        const CURRENT_USER_ID = <?= json_encode($user_id) ?>;
        const CURRENT_USER_NAME = <?= json_encode($name) ?>;
        const CURRENT_LANG = <?= json_encode($lang) ?>;
        const log = document.getElementById("log");

        const append = (msg) => {
            const p = document.createElement("p");
            p.textContent = msg;
            log.appendChild(p);
            log.scrollTop = log.scrollHeight;
        };

        socket.on("connect", () => {
            socket.emit("register", {
                user_id: CURRENT_USER_ID,
                name: CURRENT_USER_NAME,
                from_lang: CURRENT_LANG,
            });
            append("✅ サーバーに接続しました。");
            append("📡 招待を待っています...");
        });

        // 招待受信
        socket.on("invite_received", ({
            from_id,
            from_name
        }) => {
            append(`💬 ${from_name} さんからチャットリクエスト`);
            socket.emit("accept_invite", {
                from_id
            });
        });

        socket.on("paired", ({
            partnerName,
            roomId
        }) => {
            append(`🤝 ${partnerName} さんと接続しました！`);
            append(`ルームID: ${roomId}`);
        });
    </script>
</body>

</html>