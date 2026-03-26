package com.phishguard.quiz.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;

public class QuizResultDto {

    private Long id;

    @JsonProperty("user_id")
    private Long userId;

    @JsonProperty("quiz_id")
    private Long quizId;

    @JsonProperty("score_percent")
    private Integer scorePercent;

    private Boolean passed;

    @JsonProperty("submitted_at")
    private Instant submittedAt;

    public QuizResultDto() {
    }

    public QuizResultDto(
            Long id, Long userId, Long quizId, Integer scorePercent, Boolean passed, Instant submittedAt) {
        this.id = id;
        this.userId = userId;
        this.quizId = quizId;
        this.scorePercent = scorePercent;
        this.passed = passed;
        this.submittedAt = submittedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getQuizId() {
        return quizId;
    }

    public void setQuizId(Long quizId) {
        this.quizId = quizId;
    }

    public Integer getScorePercent() {
        return scorePercent;
    }

    public void setScorePercent(Integer scorePercent) {
        this.scorePercent = scorePercent;
    }

    public Boolean getPassed() {
        return passed;
    }

    public void setPassed(Boolean passed) {
        this.passed = passed;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(Instant submittedAt) {
        this.submittedAt = submittedAt;
    }
}
