<?php
declare(strict_types=1);

list($config, $pdo) = require __DIR__ . '/../../../app/core/init.php';
phishguard_require_auth($pdo);

$stmt = $pdo->query('SELECT id, title, description, order_index FROM courses ORDER BY order_index ASC, id ASC');
phishguard_json_response(['courses' => $stmt->fetchAll()]);