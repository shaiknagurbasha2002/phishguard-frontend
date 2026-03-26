<?php
/**
 * Middleware: require auth, require admin, rate limit, JSON response helpers.
 */
declare(strict_types=1);

function phishguard_require_auth(PDO $pdo): array
{
    $user = phishguard_current_user($pdo);
    if (!$user) {
        phishguard_json_response(['error' => 'Unauthorized'], 401);
        exit;
    }
    return $user;
}

function phishguard_require_admin(PDO $pdo): array
{
    $user = phishguard_require_auth($pdo);
    if (!phishguard_is_admin($pdo, (int) $user['id'])) {
        phishguard_json_response(['error' => 'Forbidden'], 403);
        exit;
    }
    return $user;
}

function phishguard_require_post_csrf(array $config): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        phishguard_json_response(['error' => 'Method not allowed'], 405);
        exit;
    }
    if (!phishguard_csrf_validate($config)) {
        phishguard_json_response(['error' => 'Invalid CSRF token'], 403);
        exit;
    }
}

function phishguard_json_response(array $data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_SLASHES);
}

function phishguard_rate_limit(PDO $pdo, array $config, string $key, int $maxCount, int $windowSeconds): bool
{
    $stmt = $pdo->prepare('SELECT count, window_start FROM rate_limits WHERE key_name = ?');
    $stmt->execute([$key]);
    $row = $stmt->fetch();
    $now = date('Y-m-d H:i:s');
    $windowStart = $row['window_start'] ?? null;
    $count = (int) ($row['count'] ?? 0);

    if ($windowStart === null || (strtotime($now) - strtotime($windowStart)) >= $windowSeconds) {
        $windowStart = $now;
        $count = 0;
    }
    $count++;
    if ($count > $maxCount) {
        return false;
    }
    $stmt = $pdo->prepare('INSERT INTO rate_limits (key_name, count, window_start) VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE count = VALUES(count), window_start = VALUES(window_start)');
    $stmt->execute([$key, $count, $windowStart]);
    return true;
}

function phishguard_escape(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
}

function phishguard_validate_email(string $email): bool
{
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}
