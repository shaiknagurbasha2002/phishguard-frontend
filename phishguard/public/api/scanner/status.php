<?php
declare(strict_types=1);

list($config, $pdo) = require __DIR__ . '/../../../app/core/init.php';
$user = phishguard_require_auth($pdo);
$scanId = (int) ($_GET['scanId'] ?? 0);
if ($scanId <= 0) {
    phishguard_json_response(['error' => 'Invalid scanId'], 400);
    return;
}

$stmt = $pdo->prepare('SELECT id, user_id, risk_score, status, created_at, completed_at FROM email_scans WHERE id = ? AND user_id = ?');
$stmt->execute([$scanId, $user['id']]);
$scan = $stmt->fetch();
if (!$scan) {
    phishguard_json_response(['error' => 'Scan not found'], 404);
    return;
}

$stmt = $pdo->prepare('SELECT type, severity, message, detail FROM email_scan_findings WHERE scan_id = ? ORDER BY id');
$stmt->execute([$scanId]);
$scan['findings'] = $stmt->fetchAll();
phishguard_json_response($scan);