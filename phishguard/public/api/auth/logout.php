<?php
declare(strict_types=1);

list($config, $pdo) = require __DIR__ . '/../../../app/core/init.php';
phishguard_logout($config);
if ($_SERVER['REQUEST_METHOD'] === 'GET' || (strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'text/html') !== false)) {
    $base = dirname(dirname($_SERVER['SCRIPT_NAME'] ?? ''));
    $base = rtrim($base, '/') ?: '';
    header('Location: ' . $base . '/');
    exit;
}
phishguard_json_response(['message' => 'Logged out']);