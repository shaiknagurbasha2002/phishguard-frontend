package com.phishguard.dashboard.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Aggregated numbers for the logged-in user plus global stats the UI can show on the home dashboard.
 */
public class DashboardSummaryDto {

    @JsonProperty("user_id")
    private Long userId;

    @JsonProperty("full_name")
    private String fullName;

    private String email;

    @JsonProperty("total_points")
    private Integer totalPoints;

    @JsonProperty("leaderboard_rank")
    private Integer leaderboardRank;

    @JsonProperty("total_users")
    private Long totalUsers;

    @JsonProperty("training_modules_total")
    private Long trainingModulesTotal;

    @JsonProperty("training_modules_completed")
    private Long trainingModulesCompleted;

    @JsonProperty("quiz_attempts")
    private Long quizAttempts;

    @JsonProperty("quiz_best_score_percent")
    private Integer quizBestScorePercent;

    @JsonProperty("simulations_completed")
    private Long simulationsCompleted;

    @JsonProperty("email_scans_count")
    private Long emailScansCount;

    @JsonProperty("open_incidents_global")
    private Long openIncidentsGlobal;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
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

    public Integer getLeaderboardRank() {
        return leaderboardRank;
    }

    public void setLeaderboardRank(Integer leaderboardRank) {
        this.leaderboardRank = leaderboardRank;
    }

    public Long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(Long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public Long getTrainingModulesTotal() {
        return trainingModulesTotal;
    }

    public void setTrainingModulesTotal(Long trainingModulesTotal) {
        this.trainingModulesTotal = trainingModulesTotal;
    }

    public Long getTrainingModulesCompleted() {
        return trainingModulesCompleted;
    }

    public void setTrainingModulesCompleted(Long trainingModulesCompleted) {
        this.trainingModulesCompleted = trainingModulesCompleted;
    }

    public Long getQuizAttempts() {
        return quizAttempts;
    }

    public void setQuizAttempts(Long quizAttempts) {
        this.quizAttempts = quizAttempts;
    }

    public Integer getQuizBestScorePercent() {
        return quizBestScorePercent;
    }

    public void setQuizBestScorePercent(Integer quizBestScorePercent) {
        this.quizBestScorePercent = quizBestScorePercent;
    }

    public Long getSimulationsCompleted() {
        return simulationsCompleted;
    }

    public void setSimulationsCompleted(Long simulationsCompleted) {
        this.simulationsCompleted = simulationsCompleted;
    }

    public Long getEmailScansCount() {
        return emailScansCount;
    }

    public void setEmailScansCount(Long emailScansCount) {
        this.emailScansCount = emailScansCount;
    }

    public Long getOpenIncidentsGlobal() {
        return openIncidentsGlobal;
    }

    public void setOpenIncidentsGlobal(Long openIncidentsGlobal) {
        this.openIncidentsGlobal = openIncidentsGlobal;
    }
}
