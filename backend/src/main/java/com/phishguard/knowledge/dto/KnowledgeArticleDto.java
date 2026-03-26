package com.phishguard.knowledge.dto;

import java.time.Instant;

public class KnowledgeArticleDto {

    private Long id;
    private String title;
    private String summary;
    private String content;
    private String category;
    private String author;
    private Boolean published;
    private Instant publishedAt;

    public KnowledgeArticleDto() {
    }

    public KnowledgeArticleDto(
            Long id,
            String title,
            String summary,
            String content,
            String category,
            String author,
            Boolean published,
            Instant publishedAt) {
        this.id = id;
        this.title = title;
        this.summary = summary;
        this.content = content;
        this.category = category;
        this.author = author;
        this.published = published;
        this.publishedAt = publishedAt;
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

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getAuthor() {
        return author;
    }

    public void setAuthor(String author) {
        this.author = author;
    }

    public Boolean getPublished() {
        return published;
    }

    public void setPublished(Boolean published) {
        this.published = published;
    }

    public Instant getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(Instant publishedAt) {
        this.publishedAt = publishedAt;
    }
}
