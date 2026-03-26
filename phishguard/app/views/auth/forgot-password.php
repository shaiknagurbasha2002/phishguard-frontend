<?php $base = $GLOBALS['phishguard_base'] ?? ''; ?>
<div class="auth-card">
    <div class="auth-card-header">
        <div class="auth-logo"><span class="icon-shield">🛡️</span></div>
        <h1>Forgot password</h1>
        <p>Enter your email and we’ll send reset instructions (placeholder – configure in production)</p>
    </div>
    <form id="forgot-form" class="auth-form">
        <div id="forgot-error" class="auth-error" role="alert" hidden></div>
        <div class="form-group">
            <label for="forgot-email">Email</label>
            <input type="email" id="forgot-email" name="email" required>
        </div>
        <button type="submit" class="btn btn-primary btn-block">Send reset link</button>
    </form>
    <div class="auth-links">
        <a href="<?= $base ?>/">Back to sign in</a>
    </div>
</div>
