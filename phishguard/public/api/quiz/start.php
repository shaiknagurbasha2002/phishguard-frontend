<?php
declare(strict_types=1);

list($config, $pdo) = require __DIR__ . '/../../../app/core/init.php';
$user = phishguard_require_auth($pdo);
$quizId = (int) ($_GET['quizId'] ?? 0);
if ($quizId <= 0) {
    phishguard_json_response(['error' => 'Invalid quizId'], 400);
    return;
}

$stmt = $pdo->prepare('SELECT id, title FROM quizzes WHERE id = ?');
$stmt->execute([$quizId]);
$quiz = $stmt->fetch();
if (!$quiz) {
    phishguard_json_response(['error' => 'Quiz not found'], 404);
    return;
}

$stmt = $pdo->prepare('SELECT id, question_text, order_index FROM quiz_questions WHERE quiz_id = ? ORDER BY order_index, id');
$stmt->execute([$quizId]);
$questions = $stmt->fetchAll();
$qids = array_column($questions, 'id');
if (empty($qids)) {
    phishguard_json_response(['error' => 'Quiz has no questions'], 400);
    return;
}

$placeholders = implode(',', array_fill(0, count($qids), '?'));
$stmt = $pdo->prepare("SELECT id, question_id, option_text, order_index FROM quiz_options WHERE question_id IN ($placeholders) ORDER BY question_id, order_index");
$stmt->execute($qids);
$optionsByQ = [];
foreach ($stmt->fetchAll() as $o) {
    $optionsByQ[(int) $o['question_id']][] = ['id' => (int) $o['id'], 'option_text' => $o['option_text'], 'order_index' => (int) $o['order_index']];
}
foreach ($questions as &$q) {
    $q['options'] = $optionsByQ[(int) $q['id']] ?? [];
    unset($q['order_index']);
}
unset($q);

phishguard_json_response([
    'quiz_id' => $quizId,
    'title' => $quiz['title'],
    'questions' => $questions,
]);