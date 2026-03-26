<?php
declare(strict_types=1);

list($config, $pdo) = require __DIR__ . '/../../../app/core/init.php';
phishguard_require_post_csrf($config);
$user = phishguard_require_auth($pdo);

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: [];
$lessonId = (int) ($body['lessonId'] ?? 0);
$percent = (int) ($body['progress_percent'] ?? 100);
$percent = max(0, min(100, $percent));
if ($lessonId <= 0) {
    phishguard_json_response(['error' => 'Invalid lessonId'], 400);
    return;
}

$userId = (int) $user['id'];
$stmt = $pdo->prepare('INSERT INTO user_lesson_progress (user_id, lesson_id, progress_percent) VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE progress_percent = GREATEST(progress_percent, VALUES(progress_percent)), completed_at = IF(VALUES(progress_percent) >= 100, NOW(), completed_at)');
$stmt->execute([$userId, $lessonId, $percent]);

$stmt = $pdo->prepare('SELECT course_id FROM lessons WHERE id = ?');
$stmt->execute([$lessonId]);
$courseId = $stmt->fetchColumn();
if ($courseId && $percent >= 100) {
    $pdo->prepare('INSERT INTO activity_log (user_id, action, entity_type, entity_id, meta) VALUES (?, ?, ?, ?, ?)')
        ->execute([$userId, 'lesson_complete', 'lesson', $lessonId, json_encode(['course_id' => $courseId])]);
    $pdo->prepare('INSERT INTO points_ledger (user_id, points, source, source_id) VALUES (?, 10, ?, ?)')
        ->execute([$userId, 'lesson', $lessonId]);
}

phishguard_json_response(['ok' => true]);