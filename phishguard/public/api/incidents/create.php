<?php
declare(strict_types=1);

list($config, $pdo) = require __DIR__ . '/../../../app/core/init.php';
phishguard_require_post_csrf($config);
$user = phishguard_require_auth($pdo);

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: [];
$subject = trim((string) ($body['subject'] ?? ''));
$description = trim((string) ($body['description'] ?? ''));
$severity = (string) ($body['severity'] ?? 'medium');
if (!in_array($severity, ['low', 'medium', 'high', 'critical'], true)) {
    $severity = 'medium';
}
if ($subject === '' || $description === '') {
    phishguard_json_response(['error' => 'Subject and description required'], 400);
    return;
}

$stmt = $pdo->prepare('INSERT INTO incidents (user_id, subject, description, severity) VALUES (?, ?, ?, ?)');
$stmt->execute([$user['id'], $subject, $description, $severity]);
$id = (int) $pdo->lastInsertId();
phishguard_json_response(['id' => $id, 'message' => 'Incident reported']);