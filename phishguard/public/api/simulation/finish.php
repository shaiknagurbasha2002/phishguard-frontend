<?php
declare(strict_types=1);

list($config, $pdo) = require __DIR__ . '/../../../app/core/init.php';
phishguard_require_post_csrf($config);
$user = phishguard_require_auth($pdo);

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: [];
$runId = (int) ($body['runId'] ?? 0);
$score = (int) ($body['score'] ?? 0);
$score = max(0, min(100, $score));
if ($runId <= 0) {
    phishguard_json_response(['error' => 'runId required'], 400);
    return;
}

$stmt = $pdo->prepare('SELECT sr.id, sr.simulation_id, s.max_score FROM simulation_runs sr JOIN simulations s ON s.id = sr.simulation_id WHERE sr.id = ? AND sr.user_id = ? AND sr.completed_at IS NULL');
$stmt->execute([$runId, $user['id']]);
$run = $stmt->fetch();
if (!$run) {
    phishguard_json_response(['error' => 'Run not found or already completed'], 404);
    return;
}

$points = (int) round($score / 100 * (int) $run['max_score']);
$pdo->prepare('UPDATE simulation_runs SET score = ?, completed_at = NOW() WHERE id = ?')->execute([$score, $runId]);
if ($points > 0) {
    $pdo->prepare('INSERT INTO points_ledger (user_id, points, source, source_id) VALUES (?, ?, ?, ?)')
        ->execute([$user['id'], $points, 'simulation', $runId]);
}
$pdo->prepare('INSERT INTO activity_log (user_id, action, entity_type, entity_id, meta) VALUES (?, ?, ?, ?, ?)')
    ->execute([$user['id'], 'simulation_complete', 'simulation_run', $runId, json_encode(['score' => $score])]);

phishguard_json_response(['score' => $score, 'points_earned' => $points]);