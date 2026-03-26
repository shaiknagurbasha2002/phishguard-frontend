<?php
require __DIR__ . '/_cors.php';

try {
    $pdo = require __DIR__ . '/db.php';
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database unavailable']);
    exit;
}

try {
    $sql = '
        SELECT u.id, u.name AS full_name, u.email,
               COALESCE(SUM(pl.points), 0) AS total_points
        FROM users u
        LEFT JOIN points_ledger pl ON pl.user_id = u.id
        GROUP BY u.id, u.name, u.email
        ORDER BY total_points DESC
        LIMIT 50
    ';
    $stmt = $pdo->query($sql);
    $leaderboard = $stmt->fetchAll();
    echo json_encode($leaderboard);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Query failed',
        'message' => $e->getMessage(),
    ]);
}
