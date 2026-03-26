<div class="page-dashboard">
    <div id="dashboard-loading" class="loading">Loading dashboard…</div>
    <div id="dashboard-content" class="dashboard-grid" hidden>
        <section class="card welcome-card">
            <h2 id="welcome-text">Welcome</h2>
            <p class="muted">Your security awareness at a glance</p>
        </section>
        <section class="card stats-row">
            <div class="stat"><span class="stat-value" id="stat-points">0</span><span class="stat-label">Points</span></div>
            <div class="stat"><span class="stat-value" id="stat-level">1</span><span class="stat-label">Level</span></div>
            <div class="stat"><span class="stat-value" id="stat-streak">0</span><span class="stat-label">Day streak</span></div>
            <div class="stat"><span class="stat-value" id="stat-rank">—</span><span class="stat-label">Global rank</span></div>
        </section>
        <section class="card">
            <h3>Level progress</h3>
            <div class="progress-bar"><div class="progress-fill" id="level-progress" style="width:0%"></div></div>
            <p class="muted" id="level-title">Rookie</p>
        </section>
        <section class="card">
            <h3>Quick actions</h3>
            <div class="quick-actions">
                <a href="<?= $GLOBALS['phishguard_base'] ?? '' ?>/dashboard/training" class="quick-action">Start Training</a>
                <a href="<?= $GLOBALS['phishguard_base'] ?? '' ?>/dashboard/quiz" class="quick-action">Take Quiz</a>
                <a href="<?= $GLOBALS['phishguard_base'] ?? '' ?>/dashboard/scanner" class="quick-action">Scan Email</a>
                <a href="<?= $GLOBALS['phishguard_base'] ?? '' ?>/dashboard/tools" class="quick-action">Security Tools</a>
            </div>
        </section>
        <section class="card">
            <h3>Badges</h3>
            <div id="badges-list" class="badges-list"></div>
        </section>
        <section class="card">
            <h3>Recent activity</h3>
            <ul id="recent-activity" class="activity-list"></ul>
        </section>
        <section class="card">
            <h3>Notifications</h3>
            <ul id="notifications-list" class="notifications-list"></ul>
        </section>
    </div>
</div>
