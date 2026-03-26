package com.phishguard.tools.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public class SecurityToolRequestDto {

    @NotBlank
    private String name;

    private String description;

    @JsonProperty("tool_url")
    private String toolUrl;

    private String category;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getToolUrl() {
        return toolUrl;
    }

    public void setToolUrl(String toolUrl) {
        this.toolUrl = toolUrl;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }
}
