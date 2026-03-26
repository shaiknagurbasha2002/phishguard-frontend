package com.phishguard.training.dto;

public class TrainingResponseDto {

    private Long id;
    private String title;
    private String description;
    private Integer progress;

    public TrainingResponseDto() {
    }

    public TrainingResponseDto(Long id, String title, String description, Integer progress) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.progress = progress;
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

    public Integer getProgress() {
        return progress;
    }

    public void setProgress(Integer progress) {
        this.progress = progress;
    }
}
