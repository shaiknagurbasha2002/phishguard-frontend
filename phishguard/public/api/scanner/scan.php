<?php
declare(strict_types=1);

list($config, $pdo) = require __DIR__ . '/../../../app/core/init.php';
phishguard_require_post_csrf($config);
$user = phishguard_require_auth($pdo);

$rl = $config['rate_limit'];
$key = 'scanner:' . ($_SERVER['REMOTE_ADDR'] ?? 'cli') . ':' . (floor(time() / 60));
if (!phishguard_rate_limit($pdo, $config, $key, $rl['scanner_per_minute'], 60)) {
    phishguard_json_response(['error' => 'Rate limit exceeded. Try again in a minute.'], 429);
    return;
}

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: [];
$content = trim((string) ($body['content'] ?? $body['email_content'] ?? ''));
if ($content === '') {
    phishguard_json_response(['error' => 'Email content required'], 400);
    return;
}

$userId = (int) $user['id'];
$stmt = $pdo->prepare('INSERT INTO email_scans (user_id, raw_content, status) VALUES (?, ?, ?)');
$stmt->execute([$userId, $content, 'pending']);
$scanId = (int) $pdo->lastInsertId();

require __DIR__ . '/../../../app/core/scanner_analyze.php';
phishguard_analyze_email($pdo, $scanId, $content);

phishguard_json_response(['scanId' => $scanId, 'message' => 'Scan started']);