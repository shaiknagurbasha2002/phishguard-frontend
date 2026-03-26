<div class="page-quiz">
    <div id="quiz-list-view">
        <div id="quiz-list-loading" class="loading">Loading quizzes…</div>
        <div id="quiz-list-content" class="card" hidden>
            <h3>Available quizzes</h3>
            <ul id="quizzes-list"></ul>
        </div>
    </div>
    <div id="quiz-take-view" hidden>
        <div class="card">
            <h2 id="quiz-title"></h2>
            <form id="quiz-form">
                <div id="quiz-questions"></div>
                <button type="submit" class="btn btn-primary">Submit</button>
            </form>
        </div>
    </div>
    <div id="quiz-result-view" class="card" hidden>
        <h3>Result</h3>
        <p id="quiz-score-text"></p>
        <p id="quiz-points-text"></p>
        <button type="button" class="btn btn-secondary" id="quiz-back">Back to quizzes</button>
    </div>
</div>
