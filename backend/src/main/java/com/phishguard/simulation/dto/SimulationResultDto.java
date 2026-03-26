package com.phishguard.simulation.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;

public class SimulationResultDto {

    private Long id;

    @JsonProperty("user_id")
    private Long userId;

    @JsonProperty("simulation_id")
    private Long simulationId;

    @JsonProperty("score_percent")
    private Integer scorePercent;

    private Boolean passed;
    private String details;

    @JsonProperty("created_at")
    private Instant createdAt;

    public SimulationResultDto() {
    }

    public SimulationResultDto(
            Long id,
            Long userId,
            Long simulationId,
            Integer scorePercent,
            Boolean passed,
            String details,
            Instant createdAt) {
        this.id = id;
        this.userId = userId;
        this.simulationId = simulationId;
        this.scorePercent = scorePercent;
        this.passed = passed;
        this.details = details;
        this.createdAt = createdAt;
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

    public Long getSimulationId() {
        return simulationId;
    }

    public void setSimulationId(Long simulationId) {
        this.simulationId = simulationId;
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

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
