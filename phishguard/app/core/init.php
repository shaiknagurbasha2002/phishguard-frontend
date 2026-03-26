<?php
/**
 * Single init for API and pages: config + PDO. No session start (call when needed).
 */
declare(strict_types=1);

$config = require __DIR__ . '/bootstrap.php';
$GLOBALS['phishguard_config'] = $config;
$pdo = require __DIR__ . '/db.php';
require __DIR__ . '/auth.php';
require __DIR__ . '/csrf.php';
require __DIR__ . '/middleware.php';

return [$config, $pdo];
