<?php
/**
 * Fallback polling endpoint: returns same data as dashboard + notifications + recent activity.
 * Client polls this when SSE is not available.
 */
declare(strict_types=1);

list($config, $pdo) = require __DIR__ . '/../../app/core/init.php';
$user = phishguard_require_auth($pdo);
$userId = (int) $user['id'];

$since = $_GET['since'] ?? '';
$ts = $since !== '' ? strtotime($since) : 0;

$notifications = [];
$stmt = $pdo->prepare('SELECT id, title, body, type, link, read_at, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20');
$stmt->execute([$userId]);
foreach ($stmt->fetchAll() as $n) {
    if ($ts && strtotime($n['created_at']) <= $ts) continue;
    $notifications[] = $n;
}

$recentActivity = [];
$stmt = $pdo->prepare('SELECT id, action, entity_type, entity_id, meta, created_at FROM activity_log WHERE user_id = ? ORDER BY created_at DESC LIMIT 15');
$stmt->execute([$userId]);
foreach ($stmt->fetchAll() as $a) {
    if ($ts && strtotime($a['created_at']) <= $ts) continue;
    $recentActivity[] = $a;
}

$unreadCount = 0;
$stmt = $pdo->prepare('SELECT COUNT(*) FROM notifications WHERE user_id = ? AND read_at IS NULL');
$stmt->execute([$userId]);
$unreadCount = (int) $stmt->fetchColumn();

phishguard_json_response([
    'notifications' => $notifications,
    'recent_activity' => $recentActivity,
    'notifications_unread_count' => $unreadCount,
]);