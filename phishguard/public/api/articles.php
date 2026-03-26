<?php
declare(strict_types=1);

list($config, $pdo) = require __DIR__ . '/../../app/core/init.php';
$user = phishguard_require_auth($pdo);
$userId = (int) $user['id'];

$search = trim((string) ($_GET['q'] ?? ''));
$category = (int) ($_GET['category'] ?? 0);

$sql = 'SELECT a.id, a.title, a.slug, a.excerpt, a.created_at, ac.name AS category_name
        FROM articles a
        LEFT JOIN article_categories ac ON ac.id = a.category_id
        WHERE 1=1';
$params = [];
if ($category > 0) {
    $sql .= ' AND a.category_id = ?';
    $params[] = $category;
}
if ($search !== '') {
    $sql .= ' AND (a.title LIKE ? OR a.content LIKE ?)';
    $term = '%' . $search . '%';
    $params[] = $term;
    $params[] = $term;
}
$sql .= ' ORDER BY a.created_at DESC LIMIT 100';
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$articles = $stmt->fetchAll();

$stmt = $pdo->prepare('SELECT article_id FROM user_bookmarks WHERE user_id = ?');
$stmt->execute([$userId]);
$bookmarked = array_column($stmt->fetchAll(), 'article_id');

foreach ($articles as &$a) {
    $a['bookmarked'] = in_array((int) $a['id'], $bookmarked, true);
}
unset($a);

$stmt = $pdo->query('SELECT id, name, slug FROM article_categories ORDER BY name');
$categories = $stmt->fetchAll();

phishguard_json_response(['articles' => $articles, 'categories' => $categories]);