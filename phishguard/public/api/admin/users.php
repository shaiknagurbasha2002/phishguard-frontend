<?php
declare(strict_types=1);

list($config, $pdo) = require __DIR__ . '/../../../app/core/init.php';
phishguard_require_admin($pdo);

$search = trim((string) ($_GET['q'] ?? ''));
$sql = 'SELECT u.id, u.email, u.name, u.created_at, GROUP_CONCAT(r.name) AS roles
        FROM users u
        LEFT JOIN user_roles ur ON ur.user_id = u.id
        LEFT JOIN roles r ON r.id = ur.role_id
        WHERE 1=1';
$params = [];
if ($search !== '') {
    $sql .= ' AND (u.email LIKE ? OR u.name LIKE ?)';
    $term = '%' . $search . '%';
    $params[] = $term;
    $params[] = $term;
}
$sql .= ' GROUP BY u.id ORDER BY u.id ASC LIMIT 200';
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$users = $stmt->fetchAll();
foreach ($users as &$u) {
    $u['roles'] = $u['roles'] ? array_map('trim', explode(',', $u['roles'])) : [];
}
unset($u);

phishguard_json_response(['users' => $users]);