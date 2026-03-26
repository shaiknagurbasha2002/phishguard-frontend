package com.phishguard.incident.controller;

import com.phishguard.incident.dto.IncidentCreateRequest;
import com.phishguard.incident.model.Incident;
import com.phishguard.incident.repository.IncidentRepository;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

    private final IncidentRepository incidentRepository;

    public IncidentController(IncidentRepository incidentRepository) {
        this.incidentRepository = incidentRepository;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Incident create(@Valid @RequestBody IncidentCreateRequest body) {
        Incident incident = new Incident();
        incident.setUserId(body.getUserId());
        incident.setTitle(body.getTitle().trim());
        incident.setDescription(body.getDescription());
        if (body.getSeverity() != null && !body.getSeverity().isBlank()) {
            incident.setSeverity(body.getSeverity().trim().toUpperCase());
        }
        if (body.getStatus() != null && !body.getStatus().isBlank()) {
            incident.setStatus(body.getStatus().trim().toUpperCase());
        }
        incident.setReportedAt(Instant.now());
        return incidentRepository.save(incident);
    }

    @GetMapping
    public List<Incident> getAll() {
        return incidentRepository.findAll(Sort.by(Sort.Direction.DESC, "reportedAt"));
    }

    @GetMapping("/user/{userId}")
    public List<Incident> getByUser(@PathVariable Long userId) {
        return incidentRepository.findByUserIdOrderByReportedAtDesc(userId);
    }
}
