package com.phishguard.incident.controller;

import com.phishguard.incident.dto.IncidentReportDto;
import com.phishguard.incident.dto.IncidentReportRequestDto;
import com.phishguard.incident.service.IncidentReportService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/incident-reports")
public class IncidentReportController {

    private final IncidentReportService service;

    public IncidentReportController(IncidentReportService service) {
        this.service = service;
    }

    @GetMapping
    public List<IncidentReportDto> list(@RequestParam(required = false) Long userId) {
        return service.findAll(userId);
    }

    @GetMapping("/summary/open-count")
    public Map<String, Long> openCount() {
        return Map.of("open_count", service.countOpen());
    }

    @GetMapping("/{id}")
    public IncidentReportDto get(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public IncidentReportDto create(@Valid @RequestBody IncidentReportRequestDto body) {
        return service.create(body);
    }

    @PutMapping("/{id}")
    public IncidentReportDto update(@PathVariable Long id, @Valid @RequestBody IncidentReportRequestDto body) {
        return service.update(id, body);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
