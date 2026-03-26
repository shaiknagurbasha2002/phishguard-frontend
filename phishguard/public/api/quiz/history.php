<?php
declare(strict_types=1);

list($config, $pdo) = require __DIR__ . '/../../../app/core/init.php';
$user = phishguard_require_auth($pdo);
$userId = (int) $user['id'];

$stmt = $pdo->prepare('
    SELECT qa.id, qa.quiz_id, q.title AS quiz_title, qa.score, qa.correct_count, qa.total_questions, qa.completed_at
    FROM quiz_attempts qa
    JOIN quizzes q ON q.id = qa.quiz_id
    WHERE qa.user_id = ?
    ORDER BY qa.completed_at DESC
    LIMIT 50
');
$stmt->execute([$userId]);
phishguard_json_response(['attempts' => $stmt->fetchAll()]);