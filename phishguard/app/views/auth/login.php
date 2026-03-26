<?php $base = $GLOBALS['phishguard_base'] ?? ''; ?>
<div class="auth-card">
    <div class="auth-card-header">
        <div class="auth-logo"><span class="icon-shield">🛡️</span></div>
        <h1>Welcome to PhishGuard</h1>
        <p>Sign in to protect yourself from cyber threats</p>
    </div>
    <form id="login-form" class="auth-form">
        <div id="login-error" class="auth-error" role="alert" hidden></div>
        <div class="form-group">
            <label for="email">Email Address</label>
            <input type="email" id="email" name="email" placeholder="you@example.com" required autocomplete="email">
        </div>
        <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" placeholder="••••••••" required autocomplete="current-password">
        </div>
        <button type="submit" class="btn btn-primary btn-block" id="login-btn">Sign in</button>
    </form>
    <div class="auth-links">
        <a href="<?= $base ?>/register">Create account</a>
        <a href="<?= $base ?>/forgot-password">Forgot password?</a>
    </div>
</div>
