package com.phishguard.profile.controller;

import com.phishguard.profile.dto.ProfileRequestDto;
import com.phishguard.profile.dto.ProfileResponseDto;
import com.phishguard.profile.service.ProfileService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profiles")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public List<ProfileResponseDto> list() {
        return profileService.findAll();
    }

    @GetMapping("/user/{userId}")
    public ProfileResponseDto getByUser(@PathVariable Long userId) {
        return profileService.findByUserId(userId);
    }

    @PostMapping
    public ProfileResponseDto createOrUpdate(@Valid @RequestBody ProfileRequestDto body) {
        return profileService.upsert(body);
    }

    @PutMapping("/user/{userId}")
    public ProfileResponseDto put(
            @PathVariable Long userId, @Valid @RequestBody ProfileRequestDto body) {
        body.setUserId(userId);
        return profileService.upsert(body);
    }

    @DeleteMapping("/user/{userId}")
    public void delete(@PathVariable Long userId) {
        profileService.deleteByUserId(userId);
    }
}
