(function () {
  const BASE = window.PHISHGUARD_BASE || '';
  const CSRF = window.PHISHGUARD_CSRF || { name: 'csrf_token', token: '' };

  function api(url, options = {}) {
    const opts = {
      headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': CSRF.token, ...options.headers },
      ...options
    };
    if (opts.body && typeof opts.body === 'object' && !(opts.body instanceof FormData)) {
      opts.body = JSON.stringify(opts.body);
    }
    return fetch(BASE + url, opts).then(r => r.json());
  }

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = document.getElementById('login-error');
      const btn = document.getElementById('login-btn');
      err.hidden = true;
      btn.disabled = true;
      try {
        const res = await api('/api/auth/login.php', {
          method: 'POST',
          body: { email: document.getElementById('email').value, password: document.getElementById('password').value }
        });
        if (res.error) {
          err.textContent = res.error;
          err.hidden = false;
        } else {
          window.location.href = BASE + '/dashboard';
        }
      } catch (_) {
        err.textContent = 'Network error';
        err.hidden = false;
      }
      btn.disabled = false;
    });
  }

  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = document.getElementById('register-error');
      const btn = document.getElementById('register-btn');
      const pass = document.getElementById('reg-password').value;
      const confirm = document.getElementById('confirm').value;
      if (pass !== confirm) {
        err.textContent = 'Passwords do not match';
        err.hidden = false;
        return;
      }
      err.hidden = true;
      btn.disabled = true;
      try {
        const res = await api('/api/auth/register.php', {
          method: 'POST',
          body: {
            name: document.getElementById('name').value,
            email: document.getElementById('reg-email').value,
            password: pass
          }
        });
        if (res.error) {
          err.textContent = res.error;
          err.hidden = false;
        } else {
          window.location.href = BASE + '/dashboard';
        }
      } catch (_) {
        err.textContent = 'Network error';
        err.hidden = false;
      }
      btn.disabled = false;
    });
  }

  const forgotForm = document.getElementById('forgot-form');
  if (forgotForm) {
    forgotForm.addEventListener('submit', (e) => {
      e.preventDefault();
      document.getElementById('forgot-error').textContent = 'Password reset not configured. Contact your administrator.';
      document.getElementById('forgot-error').hidden = false;
    });
  }
})();
