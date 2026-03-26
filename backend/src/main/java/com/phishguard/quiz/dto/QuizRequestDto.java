package com.phishguard.quiz.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class QuizRequestDto {

    @NotBlank
    private String title;

    private String description;

    @NotNull
    @Min(0)
    @Max(100)
    @JsonProperty("passing_score_percent")
    private Integer passingScorePercent = 70;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getPassingScorePercent() {
        return passingScorePercent;
    }

    public void setPassingScorePercent(Integer passingScorePercent) {
        this.passingScorePercent = passingScorePercent;
    }
}
