package com.phishguard.leaderboard.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class LeaderboardEntryDto {

    private int rank;
    private Long id;

    /** Display name (same as {@code User.name}). */
    private String name;
    private String email;

    @JsonProperty("total_points")
    private Integer totalPoints;

    public LeaderboardEntryDto() {
    }

    public LeaderboardEntryDto(int rank, Long id, String name, String email, Integer totalPoints) {
        this.rank = rank;
        this.id = id;
        this.name = name;
        this.email = email;
        this.totalPoints = totalPoints;
    }

    public int getRank() {
        return rank;
    }

    public void setRank(int rank) {
        this.rank = rank;
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
