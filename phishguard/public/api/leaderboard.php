<?php
declare(strict_types=1);

list($config, $pdo) = require __DIR__ . '/../../app/core/init.php';
$user = phishguard_require_auth($pdo);
$range = $_GET['range'] ?? 'monthly';
$valid = ['weekly', 'monthly'];
if (!in_array($range, $valid, true)) {
    $range = 'monthly';
}

$since = $range === 'weekly'
    ? date('Y-m-d H:i:s', strtotime('-7 days'))
    : date('Y-m-d H:i:s', strtotime('-30 days'));

$stmt = $pdo->query("
    SELECT u.id, u.name, u.email,
           COALESCE(SUM(pl.points), 0) AS total_points
    FROM users u
    LEFT JOIN points_ledger pl ON pl.user_id = u.id AND pl.created_at >= '$since'
    GROUP BY u.id
    ORDER BY total_points DESC
    LIMIT 100
");
$rows = $stmt->fetchAll();
$currentId = (int) $user['id'];
$rank = 0;
foreach ($rows as $i => $row) {
    $rows[$i]['rank'] = $i + 1;
    if ((int) $row['id'] === $currentId) {
        $rank = $i + 1;
    }
}

phishguard_json_response([
    'range' => $range,
    'leaderboard' => $rows,
    'current_user_rank' => $rank,
]);