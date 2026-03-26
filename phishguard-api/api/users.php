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
    $stmt = $pdo->query('SELECT id, name AS full_name, email FROM users ORDER BY id ASC');
    $users = $stmt->fetchAll();
    echo json_encode($users);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Query failed',
        'message' => $e->getMessage(),
    ]);
}
