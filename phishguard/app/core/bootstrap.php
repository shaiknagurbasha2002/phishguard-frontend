<?php
/**
 * Load config and common dependencies for API and public entry.
 */
declare(strict_types=1);

if (!defined('PHISHGUARD_ROOT')) {
    define('PHISHGUARD_ROOT', dirname(__DIR__, 2));
}

$configPath = __DIR__ . '/../config/config.php';
$localPath = __DIR__ . '/../config/config.local.php';
$config = require $configPath;
if (is_file($localPath)) {
    $config = array_replace_recursive($config, require $localPath);
}

return $config;
