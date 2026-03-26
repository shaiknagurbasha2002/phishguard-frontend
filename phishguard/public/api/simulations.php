<?php
declare(strict_types=1);

list($config, $pdo) = require __DIR__ . '/../../../app/core/init.php';
phishguard_require_auth($pdo);

$stmt = $pdo->query('SELECT id, title, description, scenario_type, max_score FROM simulations ORDER BY id');
phishguard_json_response(['simulations' => $stmt->fetchAll()]);