<?php
/**
 * CSRF token generation and validation for POST requests.
 */
declare(strict_types=1);

function phishguard_csrf_token(array $config): string
{
    $c = $config['csrf'];
    $name = $c['token_name'];
    phishguard_session_start($config);
    if (empty($_SESSION[$name]) || ($_SESSION[$name . '_exp'] ?? 0) < time()) {
        $_SESSION[$name] = bin2hex(random_bytes(32));
        $_SESSION[$name . '_exp'] = time() + $c['lifetime'];
    }
    return $_SESSION[$name];
}

function phishguard_csrf_validate(array $config): bool
{
    $c = $config['csrf'];
    $name = $c['token_name'];
    phishguard_session_start($config);
    $token = $_SESSION[$name] ?? '';
    $submitted = $_POST[$name] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    return $token !== '' && hash_equals($token, $submitted);
}

function phishguard_csrf_input(array $config): string
{
    $token = phishguard_csrf_token($config);
    $name = htmlspecialchars($config['csrf']['token_name'], ENT_QUOTES, 'UTF-8');
    $value = htmlspecialchars($token, ENT_QUOTES, 'UTF-8');
    return '<input type="hidden" name="' . $name . '" value="' . $value . '">';
}
