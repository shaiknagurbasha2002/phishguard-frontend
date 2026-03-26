<?php
$base = $GLOBALS['phishguard_base'] ?? '';
$user = $GLOBALS['phishguard_user'] ?? null;
$view = $GLOBALS['phishguard_view'] ?? 'dashboard';
$isAdmin = $GLOBALS['phishguard_is_admin'] ?? false;
$csrfName = $GLOBALS['phishguard_config']['csrf']['token_name'] ?? 'csrf_token';
$csrfToken = phishguard_csrf_token($GLOBALS['phishguard_config']);
$nav = [
    ['name' => 'Dashboard', 'href' => $base . '/dashboard', 'page' => 'dashboard'],
    ['name' => 'Training', 'href' => $base . '/dashboard/training', 'page' => 'training'],
    ['name' => 'Quiz', 'href' => $base . '/dashboard/quiz', 'page' => 'quiz'],
    ['name' => 'Email Scanner', 'href' => $base . '/dashboard/scanner', 'page' => 'scanner'],
    ['name' => 'Leaderboard', 'href' => $base . '/dashboard/leaderboard', 'page' => 'leaderboard'],
    ['name' => 'Simulation', 'href' => $base . '/dashboard/simulation', 'page' => 'simulation'],
    ['name' => 'Knowledge Hub', 'href' => $base . '/dashboard/knowledge', 'page' => 'knowledge'],
    ['name' => 'Report Incident', 'href' => $base . '/dashboard/report', 'page' => 'report'],
    ['name' => 'Security Tools', 'href' => $base . '/dashboard/tools', 'page' => 'tools'],
];
if ($isAdmin) {
    $nav[] = ['name' => 'Admin Panel', 'href' => $base . '/dashboard/admin', 'page' => 'admin'];
}
$pageTitle = $view === 'dashboard' ? 'Dashboard' : ucfirst(str_replace('-', ' ', $view));
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= phishguard_escape($pageTitle) ?> - PhishGuard</title>
    <link rel="stylesheet" href="<?= $base ?>/assets/css/style.css">
</head>
<body class="dashboard-page">
    <div class="dashboard-bg"></div>
    <aside class="sidebar" id="sidebar">
        <div class="sidebar-brand">
            <span class="icon-shield">🛡️</span>
            <span>PhishGuard</span>
        </div>
        <nav class="sidebar-nav" aria-label="Main">
            <ul>
                <?php foreach ($nav as $item): ?>
                <li>
                    <a href="<?= phishguard_escape($item['href']) ?>" class="<?= $item['page'] === $view ? 'active' : '' ?>"><?= phishguard_escape($item['name']) ?></a>
                </li>
                <?php endforeach; ?>
            </ul>
        </nav>
    </aside>
    <div class="dashboard-main">
        <header class="dashboard-header">
            <button type="button" class="menu-toggle" id="menu-toggle" aria-label="Open menu"></button>
            <h1 class="page-title"><?= phishguard_escape($pageTitle) ?></h1>
            <div class="header-actions">
                <a href="#" class="icon-btn" id="notifications-btn" aria-label="Notifications"><span id="notif-count"></span> 🔔</a>
                <div class="user-menu">
                    <button type="button" class="user-menu-btn" id="user-menu-btn"><?= phishguard_escape($user['name'] ?? 'User') ?> ▼</button>
                    <div class="user-dropdown" id="user-dropdown" hidden>
                        <p class="user-email"><?= phishguard_escape($user['email'] ?? '') ?></p>
                        <a href="<?= $base ?>/api/auth/logout.php" class="logout-link" id="logout-link">Log out</a>
                    </div>
                </div>
            </div>
        </header>
        <main class="dashboard-content" id="main-content" data-page="<?= phishguard_escape($view) ?>">
            <?php include __DIR__ . '/../dashboard/' . $view . '.php'; ?>
        </main>
    </div>
    <script>
        window.PHISHGUARD_BASE = <?= json_encode($base) ?>;
        window.PHISHGUARD_CSRF = { name: <?= json_encode($csrfName) ?>, token: <?= json_encode($csrfToken) ?> };
        window.PHISHGUARD_PAGE = <?= json_encode($view) ?>;
    </script>
    <script src="<?= $base ?>/assets/js/app.js"></script>
</body>
</html>
