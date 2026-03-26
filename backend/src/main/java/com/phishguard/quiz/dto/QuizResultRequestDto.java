package com.phishguard.quiz.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class QuizResultRequestDto {

    @NotNull
    @JsonProperty("user_id")
    private Long userId;

    @NotNull
    @JsonProperty("quiz_id")
    private Long quizId;

    @NotNull
    @Min(0)
    @Max(100)
    @JsonProperty("score_percent")
    private Integer scorePercent;

    @NotNull
    private Boolean passed;

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
}
