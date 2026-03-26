package com.phishguard.quiz.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public class QuizQuestionRequestDto {

    @NotNull
    @JsonProperty("quiz_id")
    private Long quizId;

    @NotBlank
    @JsonProperty("question_text")
    private String questionText;

    @NotBlank
    @JsonProperty("option_a")
    private String optionA;

    @NotBlank
    @JsonProperty("option_b")
    private String optionB;

    @NotBlank
    @JsonProperty("option_c")
    private String optionC;

    @NotBlank
    @JsonProperty("option_d")
    private String optionD;

    @NotBlank
    @Pattern(regexp = "[AaBbCcDd]", message = "Must be A, B, C, or D")
    @JsonProperty("correct_option")
    private String correctOption;

    @JsonProperty("sort_order")
    private Integer sortOrder;

    public Long getQuizId() {
        return quizId;
    }

    public void setQuizId(Long quizId) {
        this.quizId = quizId;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }

    public String getOptionA() {
        return optionA;
    }

    public void setOptionA(String optionA) {
        this.optionA = optionA;
    }

    public String getOptionB() {
        return optionB;
    }

    public void setOptionB(String optionB) {
        this.optionB = optionB;
    }

    public String getOptionC() {
        return optionC;
    }

    public void setOptionC(String optionC) {
        this.optionC = optionC;
    }

    public String getOptionD() {
        return optionD;
    }

    public void setOptionD(String optionD) {
        this.optionD = optionD;
    }

    public String getCorrectOption() {
        return correctOption;
    }

    public void setCorrectOption(String correctOption) {
        this.correctOption = correctOption;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }
}
