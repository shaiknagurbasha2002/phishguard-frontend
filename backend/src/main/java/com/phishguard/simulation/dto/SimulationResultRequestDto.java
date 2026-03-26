package com.phishguard.simulation.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class SimulationResultRequestDto {

    @NotNull
    @JsonProperty("user_id")
    private Long userId;

    @NotNull
    @JsonProperty("simulation_id")
    private Long simulationId;

    @NotNull
    @Min(0)
    @Max(100)
    @JsonProperty("score_percent")
    private Integer scorePercent;

    @NotNull
    private Boolean passed;

    private String details;

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
}
