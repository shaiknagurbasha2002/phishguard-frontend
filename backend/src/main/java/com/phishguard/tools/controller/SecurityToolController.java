package com.phishguard.tools.controller;

import com.phishguard.tools.dto.SecurityToolDto;
import com.phishguard.tools.dto.SecurityToolRequestDto;
import com.phishguard.tools.service.SecurityToolService;
import jakarta.validation.Valid;
import java.util.List;
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
@RequestMapping("/api/security-tools")
public class SecurityToolController {

    private final SecurityToolService service;

    public SecurityToolController(SecurityToolService service) {
        this.service = service;
    }

    @GetMapping
    public List<SecurityToolDto> list() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public SecurityToolDto get(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SecurityToolDto create(@Valid @RequestBody SecurityToolRequestDto body) {
        return service.create(body);
    }

    @PutMapping("/{id}")
    public SecurityToolDto update(@PathVariable Long id, @Valid @RequestBody SecurityToolRequestDto body) {
        return service.update(id, body);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
