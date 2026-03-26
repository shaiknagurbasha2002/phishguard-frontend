<?php
declare(strict_types=1);

list($config, $pdo) = require __DIR__ . '/../../../app/core/init.php';
phishguard_require_post_csrf($config);
$user = phishguard_require_auth($pdo);

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: [];
$simulationId = (int) ($body['simulationId'] ?? 0);
if ($simulationId <= 0) {
    phishguard_json_response(['error' => 'Invalid simulationId'], 400);
    return;
}

$stmt = $pdo->prepare('SELECT id, max_score FROM simulations WHERE id = ?');
$stmt->execute([$simulationId]);
if (!$stmt->fetch()) {
    phishguard_json_response(['error' => 'Simulation not found'], 404);
    return;
}

$stmt = $pdo->prepare('INSERT INTO simulation_runs (user_id, simulation_id) VALUES (?, ?)');
$stmt->execute([$user['id'], $simulationId]);
$runId = (int) $pdo->lastInsertId();
phishguard_json_response(['runId' => $runId]);