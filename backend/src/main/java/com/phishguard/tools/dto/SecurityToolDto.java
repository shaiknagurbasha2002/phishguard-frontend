package com.phishguard.tools.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class SecurityToolDto {

    private Long id;
    private String name;
    private String description;

    @JsonProperty("tool_url")
    private String toolUrl;

    private String category;

    public SecurityToolDto() {
    }

    public SecurityToolDto(Long id, String name, String description, String toolUrl, String category) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.toolUrl = toolUrl;
        this.category = category;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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
