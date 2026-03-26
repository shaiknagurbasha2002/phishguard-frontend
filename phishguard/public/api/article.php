<?php
declare(strict_types=1);

list($config, $pdo) = require __DIR__ . '/../../app/core/init.php';
$user = phishguard_require_auth($pdo);
$id = (int) ($_GET['id'] ?? 0);
if ($id <= 0) {
    phishguard_json_response(['error' => 'Invalid id'], 400);
    return;
}

$stmt = $pdo->prepare('SELECT a.id, a.title, a.slug, a.content, a.excerpt, a.created_at, a.category_id, ac.name AS category_name FROM articles a LEFT JOIN article_categories ac ON ac.id = a.category_id WHERE a.id = ?');
$stmt->execute([$id]);
$article = $stmt->fetch();
if (!$article) {
    phishguard_json_response(['error' => 'Article not found'], 404);
    return;
}

$stmt = $pdo->prepare('SELECT 1 FROM user_bookmarks WHERE user_id = ? AND article_id = ?');
$stmt->execute([$user['id'], $id]);
$article['bookmarked'] = (bool) $stmt->fetch();
$stmt = $pdo->prepare('SELECT progress_percent FROM user_article_progress WHERE user_id = ? AND article_id = ?');
$stmt->execute([$user['id'], $id]);
$article['progress_percent'] = (int) ($stmt->fetchColumn() ?: 0);

phishguard_json_response($article);