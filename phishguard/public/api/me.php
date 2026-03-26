<?php
declare(strict_types=1);

list($config, $pdo) = require __DIR__ . '/../../app/core/init.php';
$user = phishguard_current_user($pdo);
if (!$user) {
    phishguard_json_response(['user' => null]);
    return;
}
$user['roles'] = phishguard_user_roles($pdo, (int) $user['id']);
$user['is_admin'] = in_array('admin', $user['roles'], true);
phishguard_json_response(['user' => $user]);