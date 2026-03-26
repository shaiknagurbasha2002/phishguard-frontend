<?php
declare(strict_types=1);

list($config, $pdo) = require __DIR__ . '/../../../app/core/init.php';
$user = phishguard_require_auth($pdo);

$stmt = $pdo->prepare('SELECT id, risk_score, status, created_at, completed_at FROM email_scans WHERE user_id = ? ORDER BY created_at DESC LIMIT 50');
$stmt->execute([$user['id']]);
phishguard_json_response(['scans' => $stmt->fetchAll()]);