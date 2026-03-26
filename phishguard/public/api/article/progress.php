<?php
declare(strict_types=1);

list($config, $pdo) = require __DIR__ . '/../../../app/core/init.php';
phishguard_require_post_csrf($config);
$user = phishguard_require_auth($pdo);

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: [];
$articleId = (int) ($body['articleId'] ?? 0);
$percent = (int) ($body['progress_percent'] ?? 0);
$percent = max(0, min(100, $percent));
if ($articleId <= 0) {
    phishguard_json_response(['error' => 'articleId required'], 400);
    return;
}

$pdo->prepare('INSERT INTO user_article_progress (user_id, article_id, progress_percent) VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE progress_percent = GREATEST(progress_percent, VALUES(progress_percent))')
    ->execute([$user['id'], $articleId, $percent]);
phishguard_json_response(['ok' => true]);