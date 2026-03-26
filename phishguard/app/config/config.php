<?php
/**
 * PhishGuard configuration.
 * Copy to config.local.php and adjust for your XAMPP environment.
 */
declare(strict_types=1);

$baseDir = dirname(__DIR__, 2);

return [
    'env' => 'development',
    'base_path' => $baseDir,
    'web_root' => $baseDir . '/public',
    'database' => [
        'host' => '127.0.0.1',
        'port' => 3306,
        'name' => 'phishguard',
        'user' => 'root',
        'pass' => '',
        'charset' => 'utf8mb4',
    ],
    'session' => [
        'name' => 'PHISHGUARD_SID',
        'lifetime' => 86400,
        'path' => '/',
        'secure' => false,
        'httponly' => true,
        'samesite' => 'Lax',
    ],
    'csrf' => [
        'token_name' => 'csrf_token',
        'lifetime' => 3600,
    ],
    'rate_limit' => [
        'login_attempts' => 5,
        'login_window_seconds' => 300,
        'scanner_per_minute' => 10,
    ],
    'upload' => [
        'incident_path' => $baseDir . '/storage/incidents',
        'max_size_bytes' => 5 * 1024 * 1024, // 5MB
        'allowed_extensions' => ['pdf', 'doc', 'docx', 'txt', 'png', 'jpg', 'jpeg'],
    ],
];
