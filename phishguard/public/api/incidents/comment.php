<?php
declare(strict_types=1);

list($config, $pdo) = require __DIR__ . '/../../../app/core/init.php';
phishguard_require_post_csrf($config);
$user = phishguard_require_auth($pdo);

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: [];
$incidentId = (int) ($body['incidentId'] ?? 0);
$bodyText = trim((string) ($body['body'] ?? ''));
if ($incidentId <= 0 || $bodyText === '') {
    phishguard_json_response(['error' => 'incidentId and body required'], 400);
    return;
}

$stmt = $pdo->prepare('SELECT id, user_id FROM incidents WHERE id = ?');
$stmt->execute([$incidentId]);
$inc = $stmt->fetch();
if (!$inc) {
    phishguard_json_response(['error' => 'Incident not found'], 404);
    return;
}
$isAdmin = phishguard_is_admin($pdo, (int) $user['id']);
if ((int) $inc['user_id'] !== (int) $user['id'] && !$isAdmin) {
    phishguard_json_response(['error' => 'Forbidden'], 403);
    return;
}

$pdo->prepare('INSERT INTO incident_comments (incident_id, user_id, body, is_admin) VALUES (?, ?, ?, ?)')
    ->execute([$incidentId, $user['id'], $bodyText, $isAdmin ? 1 : 0]);
$id = (int) $pdo->lastInsertId();
phishguard_json_response(['id' => $id]);