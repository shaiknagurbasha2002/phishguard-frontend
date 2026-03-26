<?php
/**
 * Optional: Set secure passwords for seed users. Run from CLI:
 *   php scripts/set_passwords.php
 * Or from browser (remove or restrict in production).
 */
$baseDir = dirname(__DIR__);
list(, $pdo) = require $baseDir . '/app/core/init.php';

$passwords = [
    'admin@phishguard.local' => 'Admin123!',
    'student@phishguard.local' => 'Student123!',
];

$stmt = $pdo->prepare('UPDATE users SET password_hash = ? WHERE email = ?');
foreach ($passwords as $email => $password) {
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt->execute([$hash, $email]);
    echo "Updated password for $email\n";
}
echo "Done.\n";
