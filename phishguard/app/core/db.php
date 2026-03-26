<?php
/**
 * PDO database connection. Use prepared statements everywhere.
 */
declare(strict_types=1);

$config = $GLOBALS['phishguard_config'] ?? null;
if (!$config) {
    throw new RuntimeException('Config not loaded. Require bootstrap.php and set $GLOBALS["phishguard_config"]');
}

$dsn = sprintf(
    'mysql:host=%s;port=%s;dbname=%s;charset=%s',
    $config['database']['host'],
    $config['database']['port'],
    $config['database']['name'],
    $config['database']['charset']
);

$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

$pdo = new PDO(
    $dsn,
    $config['database']['user'],
    $config['database']['pass'],
    $options
);

return $pdo;
