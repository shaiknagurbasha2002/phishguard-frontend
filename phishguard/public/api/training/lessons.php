<?php
declare(strict_types=1);

list($config, $pdo) = require __DIR__ . '/../../../app/core/init.php';
$user = phishguard_require_auth($pdo);
$courseId = (int) ($_GET['courseId'] ?? 0);
if ($courseId <= 0) {
    phishguard_json_response(['error' => 'Invalid courseId'], 400);
    return;
}

$stmt = $pdo->prepare('SELECT id, title, content, order_index, duration_minutes FROM lessons WHERE course_id = ? ORDER BY order_index ASC, id ASC');
$stmt->execute([$courseId]);
$lessons = $stmt->fetchAll();

$userId = (int) $user['id'];
$stmt = $pdo->prepare('SELECT lesson_id, progress_percent, completed_at FROM user_lesson_progress WHERE user_id = ? AND lesson_id IN (SELECT id FROM lessons WHERE course_id = ?)');
$stmt->execute([$userId, $courseId]);
$progressMap = [];
foreach ($stmt->fetchAll() as $row) {
    $progressMap[(int) $row['lesson_id']] = $row;
}
foreach ($lessons as &$l) {
    $l['progress'] = $progressMap[(int) $l['id']] ?? null;
}
unset($l);

phishguard_json_response(['lessons' => $lessons]);