package com.phishguard.user.service;

import com.phishguard.user.dto.UserRequestDto;
import com.phishguard.user.dto.UserResponseDto;
import com.phishguard.user.model.User;
import com.phishguard.user.repository.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<UserResponseDto> findAll() {
        return userRepository.findAll().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public UserResponseDto findById(Long id) {
        return userRepository.findById(id).map(this::toDto).orElseThrow(() -> notFound(id));
    }

    @Transactional
    public UserResponseDto create(UserRequestDto dto) {
        if (userRepository.existsByEmailIgnoreCase(dto.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
        }
        User u = new User();
        u.setName(dto.getName().trim());
        u.setEmail(dto.getEmail().trim().toLowerCase());
        u.setPassword(dto.getPassword() != null ? dto.getPassword() : "");
        u.setTotalPoints(0);
        return toDto(userRepository.save(u));
    }

    @Transactional
    public UserResponseDto update(Long id, UserRequestDto dto) {
        User u = userRepository.findById(id).orElseThrow(() -> notFound(id));
        userRepository
                .findByEmailIgnoreCase(dto.getEmail().trim().toLowerCase())
                .ifPresent(
                        other -> {
                            if (!other.getId().equals(id)) {
                                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
                            }
                        });
        u.setName(dto.getName().trim());
        u.setEmail(dto.getEmail().trim().toLowerCase());
        return toDto(userRepository.save(u));
    }

    @Transactional
    public void delete(Long id) {
        if (!userRepository.existsById(id)) {
            throw notFound(id);
        }
        userRepository.deleteById(id);
    }

    @Transactional
    public void addPoints(Long userId, int delta) {
        User u = userRepository.findById(userId).orElseThrow(() -> notFound(userId));
        int next = Math.max(0, u.getTotalPoints() + delta);
        u.setTotalPoints(next);
        userRepository.save(u);
    }

    @Transactional(readOnly = true)
    public UserResponseDto login(String email, String password) {
        User u = userRepository.findByEmailIgnoreCase(email.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        String dbPassword = u.getPassword() == null ? "" : u.getPassword().trim();
        if (!dbPassword.equals(password.trim())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        return toDto(u);
    }

    public User getEntityOrThrow(Long id) {
        return userRepository.findById(id).orElseThrow(() -> notFound(id));
    }

    private UserResponseDto toDto(User u) {
        return new UserResponseDto(u.getId(), u.getName(), u.getEmail(), u.getTotalPoints());
    }

    private static ResponseStatusException notFound(Long id) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + id);
    }
}
