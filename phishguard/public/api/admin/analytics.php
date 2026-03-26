<?php
declare(strict_types=1);

list($config, $pdo) = require __DIR__ . '/../../../app/core/init.php';
phishguard_require_admin($pdo);

$usersTotal = (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
$incidentsOpen = (int) $pdo->query("SELECT COUNT(*) FROM incidents WHERE status IN ('new','in_review')")->fetchColumn();
$scansTotal = (int) $pdo->query('SELECT COUNT(*) FROM email_scans')->fetchColumn();
$quizzesTaken = (int) $pdo->query('SELECT COUNT(*) FROM quiz_attempts')->fetchColumn();

$stmt = $pdo->query("SELECT DATE(created_at) AS d, COUNT(*) AS c FROM activity_log WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY d ORDER BY d");
$activityByDay = $stmt->fetchAll();

phishguard_json_response([
    'users_total' => $usersTotal,
    'incidents_open' => $incidentsOpen,
    'scans_total' => $scansTotal,
    'quizzes_taken' => $quizzesTaken,
    'activity_by_day' => $activityByDay,
]);