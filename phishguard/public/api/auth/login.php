<?php
declare(strict_types=1);

list($config, $pdo) = require __DIR__ . '/../../../app/core/init.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    phishguard_json_response(['error' => 'Method not allowed'], 405);
    return;
}

$rl = $config['rate_limit'];
$key = 'login:' . ($_SERVER['REMOTE_ADDR'] ?? 'cli');
if (!phishguard_rate_limit($pdo, $config, $key, $rl['login_attempts'], $rl['login_window_seconds'])) {
    phishguard_json_response(['error' => 'Too many login attempts. Try again later.'], 429);
    return;
}

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: [];
$email = trim((string) ($body['email'] ?? ''));
$password = (string) ($body['password'] ?? '');

if ($email === '' || $password === '') {
    phishguard_json_response(['error' => 'Email and password required'], 400);
    return;
}

$user = phishguard_login($pdo, $config, $email, $password);
if (!$user) {
    phishguard_json_response(['error' => 'Invalid email or password'], 401);
    return;
}
phishguard_json_response(['user' => $user]);