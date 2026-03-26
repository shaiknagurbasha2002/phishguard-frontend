package com.phishguard.quiz.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public class QuizAnswerDto {

    @NotNull
    @JsonProperty("question_id")
    private Long questionId;

    @NotBlank
    @Pattern(regexp = "[AaBbCcDd]")
    private String choice;

    public Long getQuestionId() {
        return questionId;
    }

    public void setQuestionId(Long questionId) {
        this.questionId = questionId;
    }

    public String getChoice() {
        return choice;
    }

    public void setChoice(String choice) {
        this.choice = choice;
    }
}
