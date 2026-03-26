<?php
declare(strict_types=1);

list($config, $pdo) = require __DIR__ . '/../../../app/core/init.php';
phishguard_require_post_csrf($config);
$user = phishguard_require_auth($pdo);

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: [];
$quizId = (int) ($body['quizId'] ?? 0);
$answers = $body['answers'] ?? [];
if (!is_array($answers)) $answers = [];
if ($quizId <= 0) {
    phishguard_json_response(['error' => 'Invalid quizId'], 400);
    return;
}

$stmt = $pdo->prepare('SELECT id, points_reward FROM quizzes WHERE id = ?');
$stmt->execute([$quizId]);
$quiz = $stmt->fetch();
if (!$quiz) {
    phishguard_json_response(['error' => 'Quiz not found'], 404);
    return;
}

$userId = (int) $user['id'];
$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare('INSERT INTO quiz_attempts (user_id, quiz_id, score, total_questions, correct_count, completed_at) VALUES (?, ?, 0, 0, 0, NOW())');
    $stmt->execute([$userId, $quizId]);
    $attemptId = (int) $pdo->lastInsertId();

    $stmt = $pdo->prepare('SELECT id FROM quiz_questions WHERE quiz_id = ?');
    $stmt->execute([$quizId]);
    $questionIds = array_column($stmt->fetchAll(), 'id');
    $total = count($questionIds);
    $correct = 0;
    $explanations = [];

    foreach ($questionIds as $qid) {
        $optionId = (int) ($answers[(string) $qid] ?? 0);
        $optStmt = $pdo->prepare('SELECT id, is_correct FROM quiz_options WHERE question_id = ?');
        $optStmt->execute([$qid]);
        $opts = $optStmt->fetchAll();
        $isCorrect = 0;
        foreach ($opts as $o) {
            if ((int) $o['id'] === $optionId) {
                $isCorrect = (int) $o['is_correct'];
                break;
            }
        }
        $correct += $isCorrect;
        $qStmt = $pdo->prepare('SELECT question_text FROM quiz_questions WHERE id = ?');
        $qStmt->execute([$qid]);
        $qText = $qStmt->fetchColumn();
        $explanations[] = ['question_id' => $qid, 'question_text' => $qText, 'correct' => (bool) $isCorrect];
        $pdo->prepare('INSERT INTO quiz_answers (attempt_id, question_id, option_id, is_correct) VALUES (?, ?, ?, ?)')
            ->execute([$attemptId, $qid, $optionId ?: $opts[0]['id'] ?? 0, $isCorrect]);
    }

    $score = $total > 0 ? round($correct / $total * 100, 2) : 0;
    $pdo->prepare('UPDATE quiz_attempts SET score = ?, total_questions = ?, correct_count = ? WHERE id = ?')
        ->execute([$score, $total, $correct, $attemptId]);

    $pointsReward = (int) $quiz['points_reward'];
    $points = $total > 0 ? (int) round($pointsReward * ($correct / $total)) : 0;
    if ($points > 0) {
        $pdo->prepare('INSERT INTO points_ledger (user_id, points, source, source_id) VALUES (?, ?, ?, ?)')
            ->execute([$userId, $points, 'quiz', $attemptId]);
    }
    $pdo->prepare('INSERT INTO activity_log (user_id, action, entity_type, entity_id, meta) VALUES (?, ?, ?, ?, ?)')
        ->execute([$userId, 'quiz_complete', 'quiz', $quizId, json_encode(['score' => $score, 'correct' => $correct, 'total' => $total])]);

    $pdo->commit();
    phishguard_json_response([
        'attempt_id' => $attemptId,
        'score' => $score,
        'correct' => $correct,
        'total' => $total,
        'points_earned' => $points,
        'explanations' => $explanations,
    ]);
} catch (Throwable $e) {
    $pdo->rollBack();
    phishguard_json_response(['error' => 'Submit failed'], 500);
}