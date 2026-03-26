<div class="page-report">
    <div class="card">
        <h3>Report an incident</h3>
        <form id="incident-form">
            <div class="form-group">
                <label for="incident-subject">Subject</label>
                <input type="text" id="incident-subject" name="subject" required>
            </div>
            <div class="form-group">
                <label for="incident-desc">Description</label>
                <textarea id="incident-desc" name="description" rows="5" required></textarea>
            </div>
            <div class="form-group">
                <label for="incident-severity">Severity</label>
                <select id="incident-severity" name="severity">
                    <option value="low">Low</option>
                    <option value="medium" selected>Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                </select>
            </div>
            <button type="submit" class="btn btn-primary">Submit report</button>
        </form>
    </div>
    <div class="card">
        <h3>My reports</h3>
        <ul id="my-incidents"></ul>
    </div>
</div>
