package com.phishguard.leaderboard.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.List;

public class LeaderboardResponseDto {

    @JsonProperty("generated_at")
    private Instant generatedAt;

    private List<LeaderboardEntryDto> entries;

    public LeaderboardResponseDto() {
    }

    public LeaderboardResponseDto(Instant generatedAt, List<LeaderboardEntryDto> entries) {
        this.generatedAt = generatedAt;
        this.entries = entries;
    }

    public Instant getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(Instant generatedAt) {
        this.generatedAt = generatedAt;
    }

    public List<LeaderboardEntryDto> getEntries() {
        return entries;
    }

    public void setEntries(List<LeaderboardEntryDto> entries) {
        this.entries = entries;
    }
}
