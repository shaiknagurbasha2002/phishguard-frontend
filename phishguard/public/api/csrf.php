<?php
declare(strict_types=1);

list($config, $pdo) = require __DIR__ . '/../../app/core/init.php';
phishguard_session_start($config);
$token = phishguard_csrf_token($config);
phishguard_json_response(['csrf_token' => $token, 'csrf_token_name' => $config['csrf']['token_name']]);