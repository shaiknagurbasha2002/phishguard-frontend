<?php
/**
 * PDO MySQL connection. Use prepared statements; errors return JSON.
 * Do not require _cors here; each endpoint includes _cors.php first.
 */
$dbHost = '127.0.0.1';
$dbName = 'phishguard';
$dbUser = 'root';
$dbPass = '';

$dsn = "mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4";

try {
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
    }
    http_response_code(500);
    echo json_encode([
        'error' => 'Database connection failed',
        'message' => $e->getMessage(),
    ]);
    exit;
}

return $pdo;
