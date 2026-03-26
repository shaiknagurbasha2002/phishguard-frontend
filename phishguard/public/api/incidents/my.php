<?php
declare(strict_types=1);

list($config, $pdo) = require __DIR__ . '/../../../app/core/init.php';
$user = phishguard_require_auth($pdo);

$stmt = $pdo->prepare('SELECT id, subject, severity, status, created_at, updated_at FROM incidents WHERE user_id = ? ORDER BY created_at DESC');
$stmt->execute([$user['id']]);
phishguard_json_response(['incidents' => $stmt->fetchAll()]);