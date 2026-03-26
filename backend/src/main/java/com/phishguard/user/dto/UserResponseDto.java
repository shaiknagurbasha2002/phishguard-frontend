package com.phishguard.user.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * JSON friendly for the React client: {@code total_points} plus {@code name} (mapped to full_name on the UI).
 */
public class UserResponseDto {

    private Long id;
    private String name;
    private String email;

    @JsonProperty("total_points")
    private Integer totalPoints;

    public UserResponseDto() {
    }

    public UserResponseDto(Long id, String name, String email, Integer totalPoints) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.totalPoints = totalPoints;
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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Integer getTotalPoints() {
        return totalPoints;
    }

    public void setTotalPoints(Integer totalPoints) {
        this.totalPoints = totalPoints;
    }
}
