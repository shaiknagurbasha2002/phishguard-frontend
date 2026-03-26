<?php
declare(strict_types=1);

list($config, $pdo) = require __DIR__ . '/../../app/core/init.php';
phishguard_require_post_csrf($config);
$user = phishguard_require_auth($pdo);

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: [];
$articleId = (int) ($body['articleId'] ?? 0);
$add = (bool) ($body['add'] ?? true);
if ($articleId <= 0) {
    phishguard_json_response(['error' => 'articleId required'], 400);
    return;
}

$userId = (int) $user['id'];
if ($add) {
    $pdo->prepare('INSERT IGNORE INTO user_bookmarks (user_id, article_id) VALUES (?, ?)')->execute([$userId, $articleId]);
} else {
    $pdo->prepare('DELETE FROM user_bookmarks WHERE user_id = ? AND article_id = ?')->execute([$userId, $articleId]);
}
phishguard_json_response(['ok' => true, 'bookmarked' => $add]);