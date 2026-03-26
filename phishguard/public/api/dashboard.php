<?php
declare(strict_types=1);

list($config, $pdo) = require __DIR__ . '/../../app/core/init.php';
$user = phishguard_require_auth($pdo);
$userId = (int) $user['id'];

$stmt = $pdo->prepare('SELECT COALESCE(SUM(points), 0) AS total FROM points_ledger WHERE user_id = ?');
$stmt->execute([$userId]);
$totalPoints = (int) $stmt->fetch()['total'];

$stmt = $pdo->prepare('SELECT level_number, title FROM levels WHERE min_points <= ? ORDER BY min_points DESC LIMIT 1');
$stmt->execute([$totalPoints]);
$level = $stmt->fetch();
$nextStmt = $pdo->prepare('SELECT min_points FROM levels WHERE min_points > ? ORDER BY min_points ASC LIMIT 1');
$nextStmt->execute([$totalPoints]);
$nextLevel = $nextStmt->fetch();
$currentLevelPoints = $level ? (int) ($level['min_points'] ?? 0) : 0;
$nextLevelPoints = $nextLevel ? (int) $nextLevel['min_points'] : $currentLevelPoints;
$progress = $nextLevelPoints > $currentLevelPoints
    ? (int) round(($totalPoints - $currentLevelPoints) / ($nextLevelPoints - $currentLevelPoints) * 100)
    : 100;

$stmt = $pdo->prepare('SELECT streak_days FROM user_streaks WHERE user_id = ?');
$stmt->execute([$userId]);
$streak = (int) ($stmt->fetch()['streak_days'] ?? 0);

$stmt = $pdo->query('
    SELECT u.id, COALESCE(SUM(pl.points), 0) AS total
    FROM users u
    LEFT JOIN points_ledger pl ON pl.user_id = u.id
    GROUP BY u.id
    ORDER BY total DESC
');
$all = $stmt->fetchAll();
$rank = 0;
foreach ($all as $i => $row) {
    if ((int) $row['id'] === $userId) {
        $rank = $i + 1;
        break;
    }
}

$stmt = $pdo->prepare('SELECT b.id, b.name, b.description, b.icon FROM user_badges ub JOIN badges b ON b.id = ub.badge_id WHERE ub.user_id = ? ORDER BY ub.earned_at DESC LIMIT 10');
$stmt->execute([$userId]);
$badges = $stmt->fetchAll();

$stmt = $pdo->prepare('SELECT action, entity_type, entity_id, meta, created_at FROM activity_log WHERE user_id = ? ORDER BY created_at DESC LIMIT 15');
$stmt->execute([$userId]);
$recentActivity = $stmt->fetchAll();

$stmt = $pdo->prepare('SELECT id, title, body, type, link, read_at, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20');
$stmt->execute([$userId]);
$notifications = $stmt->fetchAll();
$unreadCount = 0;
foreach ($notifications as $n) {
    if ($n['read_at'] === null) $unreadCount++;
}

phishguard_json_response([
    'welcome' => 'Welcome, ' . $user['name'],
    'total_points' => $totalPoints,
    'level' => $level ?: ['level_number' => 1, 'title' => 'Rookie'],
    'level_progress_percent' => min(100, $progress),
    'streak' => $streak,
    'global_rank' => $rank ?: 1,
    'badges' => $badges,
    'recent_activity' => $recentActivity,
    'notifications' => $notifications,
    'notifications_unread_count' => $unreadCount,
]);