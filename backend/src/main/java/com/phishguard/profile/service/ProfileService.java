package com.phishguard.profile.service;

import com.phishguard.profile.dto.ProfileRequestDto;
import com.phishguard.profile.dto.ProfileResponseDto;
import com.phishguard.profile.model.UserProfile;
import com.phishguard.profile.repository.UserProfileRepository;
import com.phishguard.user.model.User;
import com.phishguard.user.service.UserService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProfileService {

    private final UserProfileRepository profileRepository;
    private final UserService userService;

    public ProfileService(UserProfileRepository profileRepository, UserService userService) {
        this.profileRepository = profileRepository;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public List<ProfileResponseDto> findAll() {
        return profileRepository.findAll().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public ProfileResponseDto findByUserId(Long userId) {
        userService.getEntityOrThrow(userId);
        return profileRepository
                .findByUserId(userId)
                .map(this::toDto)
                .orElseGet(() -> emptyProfile(userId));
    }

    @Transactional
    public ProfileResponseDto upsert(ProfileRequestDto dto) {
        User user = userService.getEntityOrThrow(dto.getUserId());
        UserProfile p =
                profileRepository.findByUserId(user.getId()).orElseGet(() -> newProfile(user));
        p.setBio(trimToNull(dto.getBio()));
        p.setDepartment(trimToNull(dto.getDepartment()));
        p.setPhone(trimToNull(dto.getPhone()));
        p.setJobTitle(trimToNull(dto.getJobTitle()));
        return toDto(profileRepository.save(p));
    }

    @Transactional
    public void deleteByUserId(Long userId) {
        profileRepository.findByUserId(userId).ifPresent(profileRepository::delete);
    }

    private UserProfile newProfile(User user) {
        UserProfile p = new UserProfile();
        p.setUser(user);
        return p;
    }

    private ProfileResponseDto emptyProfile(Long userId) {
        User u = userService.getEntityOrThrow(userId);
        return new ProfileResponseDto(
                userId, u.getName(), u.getEmail(), null, null, null, null);
    }

    private ProfileResponseDto toDto(UserProfile p) {
        User u = p.getUser();
        return new ProfileResponseDto(
                u.getId(),
                u.getName(),
                u.getEmail(),
                p.getBio(),
                p.getDepartment(),
                p.getPhone(),
                p.getJobTitle());
    }

    private static String trimToNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    public static ResponseStatusException notFound(Long userId) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found for user: " + userId);
    }
}
