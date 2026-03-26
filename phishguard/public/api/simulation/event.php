<?php
declare(strict_types=1);

list($config, $pdo) = require __DIR__ . '/../../../app/core/init.php';
phishguard_require_post_csrf($config);
$user = phishguard_require_auth($pdo);

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: [];
$runId = (int) ($body['runId'] ?? 0);
$eventType = trim((string) ($body['eventType'] ?? ''));
$payload = $body['payload'] ?? null;
if ($runId <= 0 || $eventType === '') {
    phishguard_json_response(['error' => 'runId and eventType required'], 400);
    return;
}

$stmt = $pdo->prepare('SELECT id FROM simulation_runs WHERE id = ? AND user_id = ? AND completed_at IS NULL');
$stmt->execute([$runId, $user['id']]);
if (!$stmt->fetch()) {
    phishguard_json_response(['error' => 'Run not found or already completed'], 404);
    return;
}

$pdo->prepare('INSERT INTO simulation_events (run_id, event_type, payload) VALUES (?, ?, ?)')
    ->execute([$runId, $eventType, $payload !== null ? json_encode($payload) : null]);
phishguard_json_response(['ok' => true]);