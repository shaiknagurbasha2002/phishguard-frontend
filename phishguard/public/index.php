<?php
/**
 * Front controller. Route by path; serve auth or dashboard layout + view.
 */
declare(strict_types=1);

$baseDir = dirname(__DIR__);
list($config, $pdo) = require $baseDir . '/app/core/init.php';
$GLOBALS['phishguard_config'] = $config;
$GLOBALS['phishguard_pdo'] = $pdo;
phishguard_session_start($config);
$user = phishguard_current_user($pdo);

$path = trim((string) ($_GET['path'] ?? ''), '/');
$path = $path === '' ? 'login' : $path;

$authPages = ['login', 'register', 'forgot-password'];
$isAuthPage = in_array($path, $authPages, true);

if (!$user && !$isAuthPage) {
    header('Location: ' . phishguard_base() . '/');
    exit;
}
if ($user && $path === 'login') {
    header('Location: ' . phishguard_base() . '/dashboard');
    exit;
}

function phishguard_base(): string {
    $base = dirname($_SERVER['SCRIPT_NAME'] ?? '');
    return rtrim($base, '/') ?: '';
}

$GLOBALS['phishguard_base'] = phishguard_base();
$GLOBALS['phishguard_user'] = $user;
$GLOBALS['phishguard_path'] = $path;

if ($isAuthPage) {
    $view = $path === 'login' ? 'login' : ($path === 'register' ? 'register' : 'forgot-password');
    require $baseDir . '/app/views/layouts/auth.php';
    return;
}

$dashboardPages = [
    'dashboard' => 'dashboard',
    'dashboard/training' => 'training',
    'dashboard/quiz' => 'quiz',
    'dashboard/scanner' => 'scanner',
    'dashboard/leaderboard' => 'leaderboard',
    'dashboard/simulation' => 'simulation',
    'dashboard/knowledge' => 'knowledge',
    'dashboard/report' => 'report',
    'dashboard/tools' => 'tools',
    'dashboard/admin' => 'admin',
];
$view = $dashboardPages[$path] ?? null;
if ($view === null) {
    if (strpos($path, 'dashboard') === 0) {
        header('Location: ' . phishguard_base() . '/dashboard');
        exit;
    }
    require $baseDir . '/app/views/404.php';
    return;
}

$isAdmin = $user ? phishguard_is_admin($pdo, (int) $user['id']) : false;
if ($view === 'admin' && !$isAdmin) {
    header('Location: ' . phishguard_base() . '/dashboard');
    exit;
}

$GLOBALS['phishguard_view'] = $view;
$GLOBALS['phishguard_is_admin'] = $isAdmin;
require $baseDir . '/app/views/layouts/dashboard.php';
