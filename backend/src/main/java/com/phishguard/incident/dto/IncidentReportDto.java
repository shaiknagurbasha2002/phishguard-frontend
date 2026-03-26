package com.phishguard.incident.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;

public class IncidentReportDto {

    private Long id;

    @JsonProperty("user_id")
    private Long userId;

    private String title;
    private String description;
    private String severity;
    private String status;

    @JsonProperty("created_at")
    private Instant createdAt;

    public IncidentReportDto() {
    }

    public IncidentReportDto(
            Long id, Long userId, String title, String description, String severity, String status, Instant createdAt) {
        this.id = id;
        this.userId = userId;
        this.title = title;
        this.description = description;
        this.severity = severity;
        this.status = status;
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

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
