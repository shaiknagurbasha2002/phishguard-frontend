<?php $base = $GLOBALS['phishguard_base'] ?? ''; ?>
<div class="auth-card">
    <div class="auth-card-header">
        <div class="auth-logo"><span class="icon-shield">🛡️</span></div>
        <h1>Create account</h1>
        <p>Join PhishGuard to build your security awareness</p>
    </div>
    <form id="register-form" class="auth-form">
        <div id="register-error" class="auth-error" role="alert" hidden></div>
        <div class="form-group">
            <label for="name">Full name</label>
            <input type="text" id="name" name="name" required autocomplete="name">
        </div>
        <div class="form-group">
            <label for="reg-email">Email</label>
            <input type="email" id="reg-email" name="email" required autocomplete="email">
        </div>
        <div class="form-group">
            <label for="reg-password">Password (min 8 characters)</label>
            <input type="password" id="reg-password" name="password" required minlength="8" autocomplete="new-password">
        </div>
        <div class="form-group">
            <label for="confirm">Confirm password</label>
            <input type="password" id="confirm" name="confirm" required minlength="8" autocomplete="new-password">
        </div>
        <button type="submit" class="btn btn-primary btn-block" id="register-btn">Register</button>
    </form>
    <div class="auth-links">
        <a href="<?= $base ?>/">Already have an account? Sign in</a>
    </div>
</div>
