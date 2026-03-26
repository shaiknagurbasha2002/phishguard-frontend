package com.phishguard.quiz.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class QuizSubmitRequestDto {

    @NotNull
    @JsonProperty("user_id")
    private Long userId;

    @NotEmpty
    @Valid
    private List<QuizAnswerDto> answers;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public List<QuizAnswerDto> getAnswers() {
        return answers;
    }

    public void setAnswers(List<QuizAnswerDto> answers) {
        this.answers = answers;
    }
}
