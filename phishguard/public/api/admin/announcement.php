<?php
declare(strict_types=1);

list($config, $pdo) = require __DIR__ . '/../../../app/core/init.php';
phishguard_require_post_csrf($config);
$user = phishguard_require_admin($pdo);

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: [];
$title = trim((string) ($body['title'] ?? ''));
$bodyText = trim((string) ($body['body'] ?? ''));
$isPinned = !empty($body['is_pinned']);
if ($title === '' || $bodyText === '') {
    phishguard_json_response(['error' => 'title and body required'], 400);
    return;
}

$pdo->prepare('INSERT INTO announcements (user_id, title, body, is_pinned) VALUES (?, ?, ?, ?)')
    ->execute([$user['id'], $title, $bodyText, $isPinned ? 1 : 0]);
$id = (int) $pdo->lastInsertId();
phishguard_json_response(['id' => $id]);