<?php
session_start();

// ダミーユーザー作成
$languages = ['ja', 'en', 'fr', 'es', 'id', 'ko', 'zh', 'de', 'ru', 'it'];
$dummy_users = [];
for ($i = 1; $i <= 10; $i++) {
  $dummy_users[] = [
    'id' => $i,
    'name' => "User {$i}",
    'lang' => $languages[($i - 1) % count($languages)],
  ];
}

// セッション登録
if (!isset($_SESSION['user_id'])) {
  $me = $dummy_users[array_rand($dummy_users)];
  $_SESSION['user_id'] = $me['id'];
  $_SESSION['name'] = $me['name'];
  $_SESSION['lang'] = $me['lang'];
}

$user_id = $_SESSION['user_id'];
$name = $_SESSION['name'];
$lang = $_SESSION['lang'];

$friends = array_filter($dummy_users, fn($u) => $u['id'] !== $user_id);
?>
<!DOCTYPE html>
<html lang="ja">

<head>
  <meta charset="UTF-8">
  <title>多言語チャット（選択）</title>
  <script src="https://cdn.tailwindcss.com"></script>

  <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
  <script>
    const socket = io("http://localhost:3000", {
      transports: ["websocket"]
    });
    const CURRENT_USER_ID = <?= json_encode($user_id) ?>;
    const CURRENT_USER_NAME = <?= json_encode($name) ?>;
    const CURRENT_LANG = <?= json_encode($lang) ?>;

    socket.on("connect", () => {
      socket.emit("register", {
        user_id: CURRENT_USER_ID,
        name: CURRENT_USER_NAME,
        from_lang: CURRENT_LANG,
      });
      console.log("✅ connected as", CURRENT_USER_NAME);
    });

    // 🔔 招待受信
    socket.on("invite_notice", ({
      from_id,
      from_name,
      room_id
    }) => {
      alert(`💬 ${from_name} さんからチャットの招待が届きました！\n\n参加するにはOKを押してください。`);
      window.location.href = `chat.php?room=${room_id}`;
    });
  </script>
</head>

<body class="bg-gray-100 p-10 text-center">
  <h1 class="text-2xl font-bold text-blue-600 mb-4">🌐 多言語チャット</h1>
  <p class="mb-4">あなた: <?= htmlspecialchars($name) ?> (<?= htmlspecialchars($lang) ?>)</p>

  <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
    <?php foreach ($friends as $friend): ?>
      <a href="#"
        onclick="inviteUser(<?= $friend['id'] ?>, '<?= htmlspecialchars($friend['name']) ?>')"
        class="bg-white p-4 rounded-lg shadow hover:bg-blue-50 transition">
        <div class="text-lg font-bold"><?= htmlspecialchars($friend['name']) ?></div>
        <div class="text-gray-500 text-sm"><?= htmlspecialchars($friend['lang']) ?></div>
      </a>
    <?php endforeach; ?>
  </div>

  <script src="js/env.js"></script>
  <script src="js/app.js"></script>
</body>

</html>