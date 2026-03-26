package com.phishguard.user.controller;

import com.phishguard.user.dto.UserRequestDto;
import com.phishguard.user.dto.UserResponseDto;
import com.phishguard.user.service.UserService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<UserResponseDto> list() {
        return userService.findAll();
    }

    @GetMapping("/{id}")
    public UserResponseDto get(@PathVariable Long id) {
        return userService.findById(id);
    }

    @PostMapping("/login")
    public UserResponseDto login(@RequestBody Map<String, String> body) {
        String email = body.getOrDefault("email", "");
        String password = body.getOrDefault("password", "");
        return userService.login(email, password);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponseDto create(@Valid @RequestBody UserRequestDto body) {
        return userService.create(body);
    }

    @PutMapping("/{id}")
    public UserResponseDto update(@PathVariable Long id, @Valid @RequestBody UserRequestDto body) {
        return userService.update(id, body);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        userService.delete(id);
    }
}
