<?php
declare(strict_types=1);

list($config, $pdo) = require __DIR__ . '/../../../app/core/init.php';
phishguard_require_auth($pdo);

$stmt = $pdo->query('SELECT id, title, description, points_reward FROM quizzes ORDER BY id ASC');
phishguard_json_response(['quizzes' => $stmt->fetchAll()]);