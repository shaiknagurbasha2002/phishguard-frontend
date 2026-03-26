(function () {
  const BASE = window.PHISHGUARD_BASE || '';
  const CSRF = window.PHISHGUARD_CSRF || { name: 'csrf_token', token: '' };
  const PAGE = window.PHISHGUARD_PAGE || 'dashboard';

  function api(url, options = {}) {
    const opts = {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': CSRF.token, ...options.headers },
      ...options
    };
    if (opts.body && typeof opts.body === 'object' && !(opts.body instanceof FormData)) {
      opts.body = JSON.stringify(opts.body);
    }
    return fetch(BASE + url, opts).then(r => r.json());
  }

  function getCsrf() {
    return fetch(BASE + '/api/csrf.php').then(r => r.json()).then(d => {
      if (d.csrf_token) CSRF.token = d.csrf_token;
      return d;
    });
  }

  // SSE with polling fallback
  let pollTimer = null;
  function startRealtime() {
    const url = BASE + '/api/stream.php';
    try {
      const es = new EventSource(url);
      es.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data);
          if (d.type === 'notifications_unread_count' && d.notifications_unread_count !== undefined) {
            const el = document.getElementById('notif-count');
            if (el) el.textContent = d.notifications_unread_count > 0 ? d.notifications_unread_count : '';
          }
          if (d.type === 'notification' && d.notification) window.dispatchEvent(new CustomEvent('phishguard-notifications', { detail: [d.notification] }));
          if (d.type === 'recent_activity' && d.recent_activity) window.dispatchEvent(new CustomEvent('phishguard-activity', { detail: [d.recent_activity] }));
        } catch (_) {}
      };
      es.onerror = () => {
        es.close();
        startPolling();
      };
    } catch (_) {
      startPolling();
    }
  }
  function startPolling() {
    if (pollTimer) return;
    let since = '';
    function poll() {
      api('/api/poll.php' + (since ? '?since=' + encodeURIComponent(since) : ''))
        .then(d => {
          since = new Date().toISOString();
          if (d.notifications_unread_count !== undefined) {
            const el = document.getElementById('notif-count');
            if (el) el.textContent = d.notifications_unread_count > 0 ? d.notifications_unread_count : '';
          }
          if (d.notifications && d.notifications.length) window.dispatchEvent(new CustomEvent('phishguard-notifications', { detail: d.notifications }));
          if (d.recent_activity && d.recent_activity.length) window.dispatchEvent(new CustomEvent('phishguard-activity', { detail: d.recent_activity }));
        })
        .catch(() => {});
    }
    poll();
    pollTimer = setInterval(poll, 10000);
  }

  // User menu & mobile sidebar
  const userMenuBtn = document.getElementById('user-menu-btn');
  const userDropdown = document.getElementById('user-dropdown');
  if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener('click', () => {
      userDropdown.hidden = !userDropdown.hidden;
    });
    document.addEventListener('click', (e) => {
      if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) userDropdown.hidden = true;
    });
  }
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }

  // Logout link: ensure we go to logout URL (GET redirects to login)
  const logoutLink = document.getElementById('logout-link');
  if (logoutLink) logoutLink.setAttribute('href', BASE + '/api/auth/logout.php');

  // Dashboard page
  if (PAGE === 'dashboard') {
    startRealtime();
    api('/api/dashboard.php').then(d => {
      document.getElementById('dashboard-loading').hidden = true;
      document.getElementById('dashboard-content').hidden = false;
      document.getElementById('welcome-text').textContent = d.welcome || 'Welcome';
      document.getElementById('stat-points').textContent = d.total_points ?? 0;
      document.getElementById('stat-level').textContent = d.level?.level_number ?? 1;
      document.getElementById('stat-streak').textContent = d.streak ?? 0;
      document.getElementById('stat-rank').textContent = d.global_rank ?? '—';
      document.getElementById('level-progress').style.width = (d.level_progress_percent ?? 0) + '%';
      document.getElementById('level-title').textContent = d.level?.title || 'Rookie';
      const badgesEl = document.getElementById('badges-list');
      badgesEl.innerHTML = (d.badges || []).map(b => '<span title="' + (b.description || '') + '">' + (b.icon ? '🏅 ' : '') + (b.name || '') + '</span>').join('') || '<span class="muted">No badges yet</span>';
      const actEl = document.getElementById('recent-activity');
      actEl.innerHTML = (d.recent_activity || []).slice(0, 10).map(a => '<li>' + (a.action || '') + ' <span class="muted">' + (a.created_at || '') + '</span></li>').join('') || '<li class="muted">No activity yet</li>';
      const notifEl = document.getElementById('notifications-list');
      notifEl.innerHTML = (d.notifications || []).slice(0, 5).map(n => '<li>' + (n.title || '') + ' ' + (n.body || '') + '</li>').join('') || '<li class="muted">No notifications</li>';
      const notifCount = document.getElementById('notif-count');
      if (notifCount) notifCount.textContent = (d.notifications_unread_count > 0 ? d.notifications_unread_count : '') || '';
    }).catch(() => {
      document.getElementById('dashboard-loading').textContent = 'Failed to load. Refresh the page.';
    });
  }

  // Training page
  if (PAGE === 'training') {
    let allCourses = [];
    function renderCourses(courses) {
      const list = document.getElementById('courses-list');
      list.innerHTML = courses.map(c => '<div class="card" data-course-id="' + c.id + '"><h3>' + (c.title || '') + '</h3><p class="muted">' + (c.description || '') + '</p></div>').join('');
      list.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', () => {
          const id = card.getAttribute('data-course-id');
          api('/api/training/lessons.php?courseId=' + id).then(r => {
            document.getElementById('course-title').textContent = allCourses.find(c => c.id == id)?.title || '';
            document.getElementById('lessons-panel').hidden = false;
            const ul = document.getElementById('lessons-list');
            ul.innerHTML = (r.lessons || []).map(l => '<li>' + (l.title || '') + (l.progress ? ' <span class="muted">' + (l.progress.progress_percent || 0) + '%</span>' : '') + '</li>').join('');
          });
        });
      });
    }
    api('/api/training/courses.php').then(d => {
      document.getElementById('training-loading').hidden = true;
      document.getElementById('training-content').hidden = false;
      allCourses = d.courses || [];
      const q = document.getElementById('training-search').value.toLowerCase();
      const filtered = allCourses.filter(c => !q || (c.title + ' ' + (c.description || '')).toLowerCase().includes(q));
      renderCourses(filtered);
    });
    document.getElementById('training-search').addEventListener('input', () => {
      const q = document.getElementById('training-search').value.toLowerCase();
      const filtered = allCourses.filter(c => !q || (c.title + ' ' + (c.description || '')).toLowerCase().includes(q));
      renderCourses(filtered);
    });
  }

  // Quiz page
  if (PAGE === 'quiz') {
    api('/api/quiz/list.php').then(d => {
      document.getElementById('quiz-list-loading').hidden = true;
      document.getElementById('quiz-list-content').hidden = false;
      document.getElementById('quizzes-list').innerHTML = (d.quizzes || []).map(q => '<li><button type="button" class="btn btn-secondary" data-quiz-id="' + q.id + '">' + (q.title || '') + ' (' + (q.points_reward || 0) + ' pts)</button></li>').join('');
      document.getElementById('quizzes-list').querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
          api('/api/quiz/start.php?quizId=' + btn.getAttribute('data-quiz-id')).then(r => {
            document.getElementById('quiz-list-view').hidden = true;
            document.getElementById('quiz-take-view').hidden = false;
            document.getElementById('quiz-title').textContent = r.title || '';
            const container = document.getElementById('quiz-questions');
            container.innerHTML = (r.questions || []).map((q, i) => '<div class="q-block"><p><strong>' + (i + 1) + '. ' + (q.question_text || '') + '</strong></p>' + (q.options || []).map(o => '<label><input type="radio" name="q' + q.id + '" value="' + o.id + '"> ' + (o.option_text || '') + '</label>').join('') + '</div>').join('');
            document.getElementById('quiz-form').dataset.quizId = r.quiz_id;
          });
        });
      });
    });
    document.getElementById('quiz-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const quizId = document.getElementById('quiz-form').dataset.quizId;
      const answers = {};
      document.querySelectorAll('#quiz-questions input[type=radio]:checked').forEach(inp => {
        const name = inp.name;
        if (name && name.startsWith('q')) answers[name.replace('q', '')] = parseInt(inp.value, 10);
      });
      await getCsrf();
      const res = await api('/api/quiz/submit.php', { method: 'POST', body: { quizId: parseInt(quizId, 10), answers } });
      document.getElementById('quiz-take-view').hidden = true;
      document.getElementById('quiz-result-view').hidden = false;
      document.getElementById('quiz-score-text').textContent = 'Score: ' + (res.score ?? 0) + '% (' + (res.correct ?? 0) + '/' + (res.total ?? 0) + ')';
      document.getElementById('quiz-points-text').textContent = 'Points earned: ' + (res.points_earned ?? 0);
    });
    document.getElementById('quiz-back').addEventListener('click', () => {
      document.getElementById('quiz-result-view').hidden = true;
      document.getElementById('quiz-list-view').hidden = false;
      document.getElementById('quiz-take-view').hidden = true;
    });
  }

  // Scanner page
  if (PAGE === 'scanner') {
    document.getElementById('scan-btn').addEventListener('click', async () => {
      const content = document.getElementById('scan-input').value.trim();
      if (!content) return;
      await getCsrf();
      const res = await api('/api/scanner/scan.php', { method: 'POST', body: { content } });
      if (res.error) { alert(res.error); return; }
      const scanId = res.scanId;
      const resultEl = document.getElementById('scan-result');
      const riskEl = document.getElementById('scan-risk');
      const findingsEl = document.getElementById('scan-findings');
      resultEl.hidden = false;
      riskEl.textContent = '…';
      findingsEl.innerHTML = '';
      const check = setInterval(async () => {
        const s = await api('/api/scanner/status.php?scanId=' + scanId);
        riskEl.textContent = (s.risk_score != null ? s.risk_score : '—') + '/100';
        findingsEl.innerHTML = (s.findings || []).map(f => '<li>' + (f.severity || '') + ': ' + (f.message || '') + '</li>').join('');
        if (s.status === 'completed' || s.status === 'failed') clearInterval(check);
      }, 500);
    });
    api('/api/scanner/history.php').then(d => {
      document.getElementById('scan-history').innerHTML = (d.scans || []).slice(0, 10).map(s => '<li>#' + s.id + ' ' + (s.risk_score != null ? s.risk_score + '%' : s.status) + ' ' + (s.created_at || '') + '</li>').join('') || '<li class="muted">No scans yet</li>';
    });
  }

  // Leaderboard page
  if (PAGE === 'leaderboard') {
    function loadLeaderboard(range) {
      api('/api/leaderboard.php?range=' + (range || 'monthly')).then(d => {
        const list = document.getElementById('leaderboard-list');
        const you = d.current_user_rank;
        list.innerHTML = (d.leaderboard || []).map((r, i) => '<li class="' + (r.rank === you ? 'you' : '') + '"><span>#' + r.rank + ' ' + (r.name || '') + '</span><span>' + (r.total_points || 0) + ' pts</span></li>').join('');
        document.getElementById('your-rank').textContent = you ? 'Your rank: #' + you : '';
      });
    }
    loadLeaderboard('monthly');
    document.querySelectorAll('.leaderboard-filters [data-range]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.leaderboard-filters [data-range]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadLeaderboard(btn.getAttribute('data-range'));
      });
    });
  }

  // Simulation page
  if (PAGE === 'simulation') {
    api('/api/simulations.php').then(d => {
      document.getElementById('sim-list-loading').hidden = true;
      document.getElementById('sim-list-content').hidden = false;
      document.getElementById('simulations-list').innerHTML = (d.simulations || []).map(s => '<li><button type="button" class="btn btn-secondary" data-sim-id="' + s.id + '" data-title="' + (s.title || '') + '" data-desc="' + (s.description || '') + '">' + (s.title || '') + '</button></li>').join('');
      document.getElementById('simulations-list').querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', async () => {
          await getCsrf();
          const r = await api('/api/simulation/start.php', { method: 'POST', body: { simulationId: parseInt(btn.getAttribute('data-sim-id'), 10) } });
          if (r.error) { alert(r.error); return; }
          document.getElementById('sim-list').hidden = true;
          document.getElementById('sim-run-view').hidden = false;
          document.getElementById('sim-title').textContent = btn.getAttribute('data-title');
          document.getElementById('sim-desc').textContent = btn.getAttribute('data-desc');
          document.getElementById('sim-run-view').dataset.runId = r.runId;
        });
      });
    });
    document.getElementById('sim-finish-btn').addEventListener('click', async () => {
      const runId = document.getElementById('sim-run-view').dataset.runId;
      await getCsrf();
      const res = await api('/api/simulation/finish.php', { method: 'POST', body: { runId: parseInt(runId, 10), score: 75 } });
      document.getElementById('sim-run-view').hidden = true;
      document.getElementById('sim-list').hidden = false;
      if (res.points_earned) alert('Score: ' + res.score + '%. Points earned: ' + res.points_earned);
    });
  }

  // Knowledge Hub page
  if (PAGE === 'knowledge') {
    function loadArticles() {
      const q = document.getElementById('article-search')?.value || '';
      const cat = document.getElementById('article-category')?.value || '';
      api('/api/articles.php?q=' + encodeURIComponent(q) + (cat ? '&category=' + cat : '')).then(d => {
        document.getElementById('articles-list').innerHTML = (d.articles || []).map(a => '<div class="card"><a href="#" data-article-id="' + a.id + '"><h3>' + (a.title || '') + '</h3><p class="muted">' + (a.excerpt || '') + '</p></a></div>').join('');
        document.getElementById('articles-list').querySelectorAll('a[data-article-id]').forEach(a => {
          a.addEventListener('click', (e) => { e.preventDefault(); api('/api/article.php?id=' + a.getAttribute('data-article-id')).then(art => { document.getElementById('articles-list').hidden = true; document.getElementById('article-detail').hidden = false; document.getElementById('article-detail-title').textContent = art.title; document.getElementById('article-detail-content').innerHTML = art.content || ''; }); });
        });
        const catEl = document.getElementById('article-category');
        if (catEl && d.categories && !catEl.options.length) { catEl.innerHTML = '<option value="">All</option>' + (d.categories.map(c => '<option value="' + c.id + '">' + (c.name || '') + '</option>').join('')); }
      });
    }
    loadArticles();
    document.getElementById('article-search')?.addEventListener('input', loadArticles);
    document.getElementById('article-category')?.addEventListener('change', loadArticles);
    document.getElementById('article-back')?.addEventListener('click', () => { document.getElementById('article-detail').hidden = true; document.getElementById('articles-list').hidden = false; });
  }

  // Report incident page
  if (PAGE === 'report') {
    document.getElementById('incident-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await getCsrf();
      const res = await api('/api/incidents/create.php', {
        method: 'POST',
        body: {
          subject: document.getElementById('incident-subject').value,
          description: document.getElementById('incident-desc').value,
          severity: document.getElementById('incident-severity').value
        }
      });
      if (res.error) alert(res.error); else { alert('Report submitted.'); document.getElementById('incident-form').reset(); api('/api/incidents/my.php').then(d => { document.getElementById('my-incidents').innerHTML = (d.incidents || []).map(i => '<li>#' + i.id + ' ' + (i.subject || '') + ' ' + (i.status || '') + '</li>').join(''); }); }
    });
    api('/api/incidents/my.php').then(d => {
      document.getElementById('my-incidents').innerHTML = (d.incidents || []).map(i => '<li>#' + i.id + ' ' + (i.subject || '') + ' ' + (i.status || '') + '</li>').join('') || '<li class="muted">No reports yet</li>';
    });
  }

  // Admin page
  if (PAGE === 'admin') {
    api('/api/admin/analytics.php').then(d => {
      document.getElementById('admin-stats').innerHTML = '<div class="stat"><span class="stat-value">' + (d.users_total ?? 0) + '</span><span class="stat-label">Users</span></div><div class="stat"><span class="stat-value">' + (d.incidents_open ?? 0) + '</span><span class="stat-label">Open incidents</span></div><div class="stat"><span class="stat-value">' + (d.scans_total ?? 0) + '</span><span class="stat-label">Scans</span></div>';
    });
    function loadUsers(q) {
      api('/api/admin/users.php' + (q ? '?q=' + encodeURIComponent(q) : '')).then(d => {
        const th = '<tr><th>ID</th><th>Email</th><th>Name</th><th>Roles</th></tr>';
        const rows = (d.users || []).map(u => '<tr><td>' + u.id + '</td><td>' + (u.email || '') + '</td><td>' + (u.name || '') + '</td><td>' + (u.roles || []).join(', ') + '</td></tr>').join('');
        document.getElementById('admin-users-table').innerHTML = '<thead>' + th + '</thead><tbody>' + rows + '</tbody>';
      });
    }
    loadUsers();
    document.getElementById('admin-user-search')?.addEventListener('input', (e) => loadUsers(e.target.value));
  }
})();
