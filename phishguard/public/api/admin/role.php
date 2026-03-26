<?php
declare(strict_types=1);

list($config, $pdo) = require __DIR__ . '/../../../app/core/init.php';
phishguard_require_post_csrf($config);
phishguard_require_admin($pdo);

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: [];
$userId = (int) ($body['userId'] ?? 0);
$roleName = trim((string) ($body['role'] ?? ''));
if ($userId <= 0 || $roleName === '') {
    phishguard_json_response(['error' => 'userId and role required'], 400);
    return;
}

$stmt = $pdo->prepare('SELECT id FROM roles WHERE name = ?');
$stmt->execute([$roleName]);
$roleId = $stmt->fetchColumn();
if (!$roleId) {
    phishguard_json_response(['error' => 'Invalid role'], 400);
    return;
}

$pdo->prepare('DELETE FROM user_roles WHERE user_id = ?')->execute([$userId]);
$pdo->prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)')->execute([$userId, $roleId]);
phishguard_json_response(['ok' => true]);