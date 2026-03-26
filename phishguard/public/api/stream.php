<?php
/**
 * Server-Sent Events stream. Client subscribes and receives real-time events.
 * Events: notifications, recent_activity, incident_update, leaderboard_update, scan_status
 */
declare(strict_types=1);

list($config, $pdo) = require __DIR__ . '/../../app/core/init.php';
$user = phishguard_current_user($pdo);
if (!$user) {
    http_response_code(401);
    exit;
}

header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('X-Accel-Buffering: no');
header('Connection: keep-alive');
if (ob_get_level()) ob_end_clean();

$userId = (int) $user['id'];
$lastId = (int) ($_GET['lastEventId'] ?? 0);

$send = function ($data, ?int $id = null) {
    if ($id !== null) {
        echo "id: " . $id . "\n";
    }
    echo "data: " . (is_string($data) ? $data : json_encode($data)) . "\n\n";
    if (ob_get_level()) ob_flush();
    flush();
};

$lastNotificationId = $lastId;
$lastActivityId = $lastId;
$checkInterval = 2;
$maxDuration = 300; // 5 min then reconnect
$start = time();

while (time() - $start < $maxDuration) {
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM notifications WHERE user_id = ? AND read_at IS NULL');
    $stmt->execute([$userId]);
    $unreadCount = (int) $stmt->fetchColumn();
    $send(['type' => 'notifications_unread_count', 'notifications_unread_count' => $unreadCount]);

    $stmt = $pdo->prepare('SELECT id, title, body, type, link, created_at FROM notifications WHERE user_id = ? AND id > ? AND read_at IS NULL ORDER BY id ASC LIMIT 5');
    $stmt->execute([$userId, $lastNotificationId]);
    foreach ($stmt->fetchAll() as $n) {
        $lastNotificationId = max($lastNotificationId, (int) $n['id']);
        $send(['type' => 'notification', 'notification' => $n], (int) $n['id']);
    }

    $stmt = $pdo->prepare('SELECT id, action, entity_type, entity_id, meta, created_at FROM activity_log WHERE user_id = ? AND id > ? ORDER BY id DESC LIMIT 5');
    $stmt->execute([$userId, $lastActivityId]);
    $rows = array_reverse($stmt->fetchAll());
    foreach ($rows as $a) {
        $lastActivityId = max($lastActivityId, (int) $a['id']);
        $send(['type' => 'recent_activity', 'recent_activity' => $a], (int) $a['id']);
    }

    $stmt = $pdo->prepare('SELECT i.id, i.status, i.updated_at FROM incidents i WHERE i.user_id = ? AND i.updated_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)');
    $stmt->execute([$userId]);
    foreach ($stmt->fetchAll() as $i) {
        $send(['type' => 'incident_update', 'incident' => $i], (int) $i['id']);
    }

    $stmt = $pdo->prepare('SELECT id, status, risk_score FROM email_scans WHERE user_id = ? AND completed_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)');
    $stmt->execute([$userId]);
    foreach ($stmt->fetchAll() as $s) {
        $send(['type' => 'scan_status', 'scan' => $s], (int) $s['id']);
    }

    $send(['type' => 'heartbeat', 't' => time()]);
    sleep($checkInterval);
}
