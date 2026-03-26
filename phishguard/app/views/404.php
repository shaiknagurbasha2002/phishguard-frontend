<?php $base = $GLOBALS['phishguard_base'] ?? ''; ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Not found - PhishGuard</title>
    <link rel="stylesheet" href="<?= $base ?>/assets/css/style.css">
</head>
<body class="dashboard-page">
    <div class="dashboard-bg"></div>
    <main class="standalone-main">
        <h1>404</h1>
        <p>Page not found.</p>
        <a href="<?= $base ?>/dashboard" class="btn btn-primary">Go to Dashboard</a>
    </main>
</body>
</html>
