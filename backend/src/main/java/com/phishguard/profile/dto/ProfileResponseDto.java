package com.phishguard.profile.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ProfileResponseDto {

    private Long userId;

    @JsonProperty("full_name")
    private String fullName;

    private String email;
    private String bio;
    private String department;
    private String phone;

    @JsonProperty("job_title")
    private String jobTitle;

    public ProfileResponseDto() {
    }

    public ProfileResponseDto(
            Long userId,
            String fullName,
            String email,
            String bio,
            String department,
            String phone,
            String jobTitle) {
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.bio = bio;
        this.department = department;
        this.phone = phone;
        this.jobTitle = jobTitle;
    }

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

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public void setJobTitle(String jobTitle) {
        this.jobTitle = jobTitle;
    }
}
