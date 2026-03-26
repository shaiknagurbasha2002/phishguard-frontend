package com.phishguard.tools.service;

import com.phishguard.tools.dto.SecurityToolDto;
import com.phishguard.tools.dto.SecurityToolRequestDto;
import com.phishguard.tools.model.SecurityTool;
import com.phishguard.tools.repository.SecurityToolRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SecurityToolService {

    private final SecurityToolRepository repository;

    public SecurityToolService(SecurityToolRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<SecurityToolDto> findAll() {
        return repository.findAll().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public SecurityToolDto findById(Long id) {
        return repository.findById(id).map(this::toDto).orElseThrow(() -> notFound(id));
    }

    @Transactional
    public SecurityToolDto create(SecurityToolRequestDto dto) {
        SecurityTool t = new SecurityTool();
        apply(dto, t);
        return toDto(repository.save(t));
    }

    @Transactional
    public SecurityToolDto update(Long id, SecurityToolRequestDto dto) {
        SecurityTool t = repository.findById(id).orElseThrow(() -> notFound(id));
        apply(dto, t);
        return toDto(repository.save(t));
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw notFound(id);
        }
        repository.deleteById(id);
    }

    private void apply(SecurityToolRequestDto dto, SecurityTool t) {
        t.setName(dto.getName().trim());
        t.setDescription(dto.getDescription());
        t.setToolUrl(dto.getToolUrl());
        t.setCategory(dto.getCategory());
    }

    private SecurityToolDto toDto(SecurityTool t) {
        return new SecurityToolDto(t.getId(), t.getName(), t.getDescription(), t.getToolUrl(), t.getCategory());
    }

    private static ResponseStatusException notFound(Long id) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Security tool not found: " + id);
    }
}
