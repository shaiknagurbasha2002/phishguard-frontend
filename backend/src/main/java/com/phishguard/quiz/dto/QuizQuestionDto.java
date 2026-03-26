package com.phishguard.quiz.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class QuizQuestionDto {

    private Long id;

    @JsonProperty("quiz_id")
    private Long quizId;

    @JsonProperty("question_text")
    private String questionText;

    @JsonProperty("option_a")
    private String optionA;

    @JsonProperty("option_b")
    private String optionB;

    @JsonProperty("option_c")
    private String optionC;

    @JsonProperty("option_d")
    private String optionD;

    @JsonProperty("correct_option")
    private String correctOption;

    @JsonProperty("sort_order")
    private Integer sortOrder;

    public QuizQuestionDto() {
    }

    public QuizQuestionDto(
            Long id,
            Long quizId,
            String questionText,
            String optionA,
            String optionB,
            String optionC,
            String optionD,
            String correctOption,
            Integer sortOrder) {
        this.id = id;
        this.quizId = quizId;
        this.questionText = questionText;
        this.optionA = optionA;
        this.optionB = optionB;
        this.optionC = optionC;
        this.optionD = optionD;
        this.correctOption = correctOption;
        this.sortOrder = sortOrder;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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
