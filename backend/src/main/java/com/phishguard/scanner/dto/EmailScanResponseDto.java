package com.phishguard.scanner.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;

public class EmailScanResponseDto {

    private Long id;

    @JsonProperty("user_id")
    private Long userId;

    private String subject;

    private String sender;

    @JsonProperty("raw_content")
    private String rawContent;

    @JsonProperty("scan_type")
    private String scanType;

    @JsonProperty("risk_score")
    private Integer riskScore;

    @JsonProperty("risk_level")
    private String riskLevel;

    private String status;

    @JsonProperty("ai_summary")
    private String aiSummary;

    @JsonProperty("findings_json")
    private String findingsJson;

    @JsonProperty("suspicious_elements_json")
    private String suspiciousElementsJson;

    @JsonProperty("created_at")
    private Instant createdAt;

    @JsonProperty("scanned_at")
    private Instant scannedAt;

    public EmailScanResponseDto() {
    }

    public EmailScanResponseDto(
            Long id,
            Long userId,
            String subject,
            String sender,
            String rawContent,
            String scanType,
            Integer riskScore,
            String riskLevel,
            String status,
            String aiSummary,
            String findingsJson,
            String suspiciousElementsJson,
            Instant createdAt,
            Instant scannedAt) {
        this.id = id;
        this.userId = userId;
        this.subject = subject;
        this.sender = sender;
        this.rawContent = rawContent;
        this.scanType = scanType;
        this.riskScore = riskScore;
        this.riskLevel = riskLevel;
        this.status = status;
        this.aiSummary = aiSummary;
        this.findingsJson = findingsJson;
        this.suspiciousElementsJson = suspiciousElementsJson;
        this.createdAt = createdAt;
        this.scannedAt = scannedAt;
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

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public String getRawContent() {
        return rawContent;
    }

    public void setRawContent(String rawContent) {
        this.rawContent = rawContent;
    }

    public String getScanType() {
        return scanType;
    }

    public void setScanType(String scanType) {
        this.scanType = scanType;
    }

    public Integer getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(Integer riskScore) {
        this.riskScore = riskScore;
    }

    public String getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(String riskLevel) {
        this.riskLevel = riskLevel;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getAiSummary() {
        return aiSummary;
    }

    public void setAiSummary(String aiSummary) {
        this.aiSummary = aiSummary;
    }

    public String getFindingsJson() {
        return findingsJson;
    }

    public void setFindingsJson(String findingsJson) {
        this.findingsJson = findingsJson;
    }

    public String getSuspiciousElementsJson() {
        return suspiciousElementsJson;
    }

    public void setSuspiciousElementsJson(String suspiciousElementsJson) {
        this.suspiciousElementsJson = suspiciousElementsJson;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getScannedAt() {
        return scannedAt;
    }

    public void setScannedAt(Instant scannedAt) {
        this.scannedAt = scannedAt;
    }
}
