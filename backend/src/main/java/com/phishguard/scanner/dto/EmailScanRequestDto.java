package com.phishguard.scanner.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

public class EmailScanRequestDto {

    @JsonProperty("user_id")
    @JsonAlias("userId")
    private Long userId;

    private String sender;

    private String subject;

    @JsonProperty("raw_content")
    @JsonAlias("content")
    private String rawContent;

    @JsonProperty("scan_type")
    @JsonAlias("scanType")
    private String scanType = "EMAIL";

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
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
}
