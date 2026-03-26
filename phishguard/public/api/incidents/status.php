<?php
declare(strict_types=1);

list($config, $pdo) = require __DIR__ . '/../../../app/core/init.php';
phishguard_require_post_csrf($config);
phishguard_require_admin($pdo);

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: [];
$incidentId = (int) ($body['incidentId'] ?? 0);
$status = (string) ($body['status'] ?? '');
if (!in_array($status, ['new', 'in_review', 'resolved', 'closed'], true)) {
    phishguard_json_response(['error' => 'Invalid status'], 400);
    return;
}
if ($incidentId <= 0) {
    phishguard_json_response(['error' => 'incidentId required'], 400);
    return;
}

$pdo->prepare('UPDATE incidents SET status = ? WHERE id = ?')->execute([$status, $incidentId]);
phishguard_json_response(['ok' => true]);