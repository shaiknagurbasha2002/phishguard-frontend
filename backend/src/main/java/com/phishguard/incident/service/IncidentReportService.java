package com.phishguard.incident.service;

import com.phishguard.incident.dto.IncidentReportDto;
import com.phishguard.incident.dto.IncidentReportRequestDto;
import com.phishguard.incident.model.IncidentReport;
import com.phishguard.incident.repository.IncidentReportRepository;
import com.phishguard.user.service.UserService;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class IncidentReportService {

    private final IncidentReportRepository repository;
    private final UserService userService;

    public IncidentReportService(IncidentReportRepository repository, UserService userService) {
        this.repository = repository;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public List<IncidentReportDto> findAll(Long userId) {
        if (userId != null) {
            userService.getEntityOrThrow(userId);
            return repository.findByUserIdOrderByCreatedAtDesc(userId).stream().map(this::toDto).toList();
        }
        return repository.findAll().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public IncidentReportDto findById(Long id) {
        return repository.findById(id).map(this::toDto).orElseThrow(() -> notFound(id));
    }

    @Transactional
    public IncidentReportDto create(IncidentReportRequestDto dto) {
        IncidentReport r = new IncidentReport();
        if (dto.getUserId() != null) {
            r.setUser(userService.getEntityOrThrow(dto.getUserId()));
        }
        apply(dto, r);
        r.setCreatedAt(Instant.now());
        return toDto(repository.save(r));
    }

    @Transactional
    public IncidentReportDto update(Long id, IncidentReportRequestDto dto) {
        IncidentReport r = repository.findById(id).orElseThrow(() -> notFound(id));
        if (dto.getUserId() != null) {
            r.setUser(userService.getEntityOrThrow(dto.getUserId()));
        } else {
            r.setUser(null);
        }
        apply(dto, r);
        return toDto(repository.save(r));
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw notFound(id);
        }
        repository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public long countOpen() {
        return repository.countByStatusIgnoreCase("OPEN");
    }

    private void apply(IncidentReportRequestDto dto, IncidentReport r) {
        r.setTitle(dto.getTitle().trim());
        r.setDescription(dto.getDescription());
        if (dto.getSeverity() != null) {
            r.setSeverity(dto.getSeverity().toUpperCase());
        }
        if (dto.getStatus() != null) {
            r.setStatus(dto.getStatus().toUpperCase());
        }
    }

    private IncidentReportDto toDto(IncidentReport r) {
        return new IncidentReportDto(
                r.getId(),
                r.getUser() != null ? r.getUser().getId() : null,
                r.getTitle(),
                r.getDescription(),
                r.getSeverity(),
                r.getStatus(),
                r.getCreatedAt());
    }

    private static ResponseStatusException notFound(Long id) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Incident report not found: " + id);
    }
}
