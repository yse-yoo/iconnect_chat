<?php
session_start();
if (!isset($_SESSION['user_id'])) {
  header("Location: index.php");
  exit;
}

$user_id = $_SESSION['user_id'];
$name = $_SESSION['name'];
$lang = $_SESSION['lang'];
$room_id = $_GET['room'] ?? null;
?>
<!DOCTYPE html>
<html lang="ja">

<head>
  <meta charset="UTF-8">
  <title>チャットルーム</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
</head>

<body class="bg-gray-100 flex flex-col items-center min-h-screen py-10">
  <div class="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6">
    <h2 class="text-2xl font-bold text-center text-green-600 mb-4">💬 チャットルーム</h2>
    <p class="text-center text-gray-700 mb-2">
      あなた: <?= htmlspecialchars($name) ?> (<?= htmlspecialchars($lang) ?>)
    </p>
    <div id="status" class="text-center text-sm text-gray-500 mb-3">接続中...</div>
    <div id="chatBox" class="border rounded p-4 h-96 overflow-y-auto bg-gray-50 text-sm whitespace-pre-wrap mb-4"></div>
    <form id="form" class="flex gap-2">
      <input id="input" placeholder="メッセージを入力..." autocomplete="off"
        class="flex-1 border rounded p-2">
      <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">送信</button>
    </form>
  </div>

  <script>
    const CURRENT_USER_ID = <?= json_encode($user_id) ?>;
    const CURRENT_USER_NAME = <?= json_encode($name) ?>;
    const CURRENT_LANG = <?= json_encode($lang) ?>;
    const ROOM_ID = <?= json_encode($room_id) ?>;
  </script>

  <script src="js/env.js"></script>
  <script src="js/chat.js"></script>
</body>

</html>