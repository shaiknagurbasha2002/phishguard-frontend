package com.phishguard.quiz.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class QuizDto {

    private Long id;
    private String title;
    private String description;

    @JsonProperty("passing_score_percent")
    private Integer passingScorePercent;

    /** First question text (for list/detail JSON consumed by the frontend). */
    private String question;

    @JsonProperty("option_a")
    private String optionA;

    @JsonProperty("option_b")
    private String optionB;

    @JsonProperty("option_c")
    private String optionC;

    @JsonProperty("option_d")
    private String optionD;

    public QuizDto() {
    }

    public QuizDto(Long id, String title, String description, Integer passingScorePercent) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.passingScorePercent = passingScorePercent;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
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
}
