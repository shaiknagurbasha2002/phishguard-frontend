<?php
declare(strict_types=1);

list($config, $pdo) = require __DIR__ . '/../../../app/core/init.php';
phishguard_require_post_csrf($config);

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: [];
$email = trim((string) ($body['email'] ?? ''));
$password = (string) ($body['password'] ?? '');
$name = trim((string) ($body['name'] ?? ''));

if ($email === '' || $password === '' || $name === '') {
    phishguard_json_response(['error' => 'Email, name and password required'], 400);
    return;
}
if (!phishguard_validate_email($email)) {
    phishguard_json_response(['error' => 'Invalid email'], 400);
    return;
}
if (strlen($password) < 8) {
    phishguard_json_response(['error' => 'Password must be at least 8 characters'], 400);
    return;
}

$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    phishguard_json_response(['error' => 'Email already registered'], 409);
    return;
}

try {
    $user = phishguard_register($pdo, $email, $password, $name);
    phishguard_session_start($config);
    $_SESSION['user_id'] = $user['id'];
    phishguard_json_response(['user' => $user, 'message' => 'Registered']);
} catch (Throwable $e) {
    phishguard_json_response(['error' => 'Registration failed'], 500);
}
