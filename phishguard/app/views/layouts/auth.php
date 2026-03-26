<?php
$base = $GLOBALS['phishguard_base'] ?? '';
$view = $view ?? 'login';
$csrfName = $GLOBALS['phishguard_config']['csrf']['token_name'] ?? 'csrf_token';
$csrfToken = phishguard_csrf_token($GLOBALS['phishguard_config']);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PhishGuard - Security Awareness</title>
    <link rel="stylesheet" href="<?= $base ?>/assets/css/style.css">
</head>
<body class="auth-page">
    <div class="auth-bg">
        <div class="auth-grid"></div>
        <div class="auth-orb auth-orb-1"></div>
        <div class="auth-orb auth-orb-2"></div>
    </div>
    <div class="auth-main">
        <?php include __DIR__ . '/../auth/' . $view . '.php'; ?>
    </div>
    <script>
        window.PHISHGUARD_BASE = <?= json_encode($base) ?>;
        window.PHISHGUARD_CSRF = { name: <?= json_encode($csrfName) ?>, token: <?= json_encode($csrfToken) ?> };
    </script>
    <script src="<?= $base ?>/assets/js/auth.js"></script>
</body>
</html>
