package com.phishguard.training.dto;

import jakarta.validation.constraints.NotBlank;

public class TrainingAttachmentRequestDto {

    @NotBlank
    private String fileUrl;

    @NotBlank
    private String fileName;

    private String fileSize;

    public String getFileUrl() {
        return fileUrl;
    }

    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFileSize() {
        return fileSize;
    }

    public void setFileSize(String fileSize) {
        this.fileSize = fileSize;
    }
}
