<?php
/**
 * Authentication: session, password_hash/password_verify, current user.
 */
declare(strict_types=1);

function phishguard_session_start(array $config): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    $s = $config['session'];
    session_name($s['name']);
    session_set_cookie_params([
        'lifetime' => $s['lifetime'],
        'path' => $s['path'],
        'secure' => $s['secure'],
        'httponly' => $s['httponly'],
        'samesite' => $s['samesite'],
    ]);
    session_start();
}

/**
 * @return array|null User row (id, email, name, ...) or null if not logged in
 */
function phishguard_current_user(PDO $pdo): ?array
{
    $config = $GLOBALS['phishguard_config'] ?? null;
    if (!$config) {
        return null;
    }
    phishguard_session_start($config);
    $uid = $_SESSION['user_id'] ?? null;
    if ($uid === null) {
        return null;
    }
    $stmt = $pdo->prepare('SELECT id, email, name, avatar_url, created_at, last_login_at FROM users WHERE id = ?');
    $stmt->execute([$uid]);
    $user = $stmt->fetch();
    return $user ?: null;
}

/**
 * @return string[] Role names for the user
 */
function phishguard_user_roles(PDO $pdo, int $userId): array
{
    $stmt = $pdo->prepare(
        'SELECT r.name FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ?'
    );
    $stmt->execute([$userId]);
    return array_column($stmt->fetchAll(), 'name');
}

function phishguard_is_admin(PDO $pdo, int $userId): bool
{
    return in_array('admin', phishguard_user_roles($pdo, $userId), true);
}

function phishguard_login(PDO $pdo, array $config, string $email, string $password): ?array
{
    $stmt = $pdo->prepare('SELECT id, email, password_hash, name FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    if (!$user || !password_verify($password, $user['password_hash'])) {
        return null;
    }
    phishguard_session_start($config);
    $_SESSION['user_id'] = (int) $user['id'];
    $pdo->prepare('UPDATE users SET last_login_at = NOW() WHERE id = ?')->execute([$user['id']]);
    unset($user['password_hash']);
    return $user;
}

function phishguard_logout(array $config): void
{
    phishguard_session_start($config);
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();
}

function phishguard_register(PDO $pdo, string $email, string $password, string $name): array
{
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)');
    $stmt->execute([$email, $hash, $name]);
    $id = (int) $pdo->lastInsertId();
    $roleUser = $pdo->prepare('INSERT INTO user_roles (user_id, role_id) SELECT ?, id FROM roles WHERE name = ?');
    $roleUser->execute([$id, 'user']);
    return ['id' => $id, 'email' => $email, 'name' => $name];
}
