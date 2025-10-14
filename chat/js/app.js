function inviteUser(targetId, targetName) {
  const roomId = `room_${Math.min(CURRENT_USER_ID, targetId)}_${Math.max(CURRENT_USER_ID, targetId)}`;
  socket.emit("invite_user", {
    from_id: CURRENT_USER_ID,
    from_name: CURRENT_USER_NAME,
    target_id: targetId,
    room_id: roomId
  });
  alert(`📨 ${targetName} さんをチャットに招待しました！`);
  // 自分はチャットに移動
  window.location.href = `chat.php?room=${roomId}`;
}