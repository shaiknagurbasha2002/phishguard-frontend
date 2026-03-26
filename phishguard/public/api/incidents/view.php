<?php
declare(strict_types=1);

list($config, $pdo) = require __DIR__ . '/../../../app/core/init.php';
$user = phishguard_require_auth($pdo);
$id = (int) ($_GET['id'] ?? 0);
if ($id <= 0) {
    phishguard_json_response(['error' => 'Invalid id'], 400);
    return;
}

$stmt = $pdo->prepare('SELECT id, user_id, subject, description, severity, status, attachment_path, created_at, updated_at FROM incidents WHERE id = ?');
$stmt->execute([$id]);
$incident = $stmt->fetch();
if (!$incident) {
    phishguard_json_response(['error' => 'Incident not found'], 404);
    return;
}
$isAdmin = phishguard_is_admin($pdo, (int) $user['id']);
if ((int) $incident['user_id'] !== (int) $user['id'] && !$isAdmin) {
    phishguard_json_response(['error' => 'Forbidden'], 403);
    return;
}

$stmt = $pdo->prepare('SELECT ic.id, ic.body, ic.is_admin, ic.created_at, u.name FROM incident_comments ic JOIN users u ON u.id = ic.user_id WHERE ic.incident_id = ? ORDER BY ic.created_at ASC');
$stmt->execute([$id]);
$incident['comments'] = $stmt->fetchAll();
phishguard_json_response($incident);