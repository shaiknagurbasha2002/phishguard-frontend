<div class="page-scanner">
    <div class="card">
        <h3>Email Scanner</h3>
        <p class="muted">Paste email header and body below for server-side analysis.</p>
        <textarea id="scan-input" rows="12" class="form-input" placeholder="Paste email content here…"></textarea>
        <button type="button" class="btn btn-primary" id="scan-btn">Scan</button>
    </div>
    <div id="scan-result" class="card" hidden>
        <h3>Result</h3>
        <p>Risk score: <strong id="scan-risk">—</strong></p>
        <ul id="scan-findings"></ul>
    </div>
    <div class="card">
        <h3>Scan history</h3>
        <ul id="scan-history"></ul>
    </div>
</div>
