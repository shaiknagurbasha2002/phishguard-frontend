package com.phishguard.simulation.controller;

import com.phishguard.simulation.dto.SimulationResultDto;
import com.phishguard.simulation.dto.SimulationResultRequestDto;
import com.phishguard.simulation.service.SimulationResultService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/simulation-results")
public class SimulationResultController {

    private final SimulationResultService service;

    public SimulationResultController(SimulationResultService service) {
        this.service = service;
    }

    @GetMapping
    public List<SimulationResultDto> list(@RequestParam(required = false) Long userId) {
        return service.findAll(userId);
    }

    @GetMapping("/{id}")
    public SimulationResultDto get(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SimulationResultDto create(@Valid @RequestBody SimulationResultRequestDto body) {
        return service.create(body);
    }

    @PutMapping("/{id}")
    public SimulationResultDto update(@PathVariable Long id, @Valid @RequestBody SimulationResultRequestDto body) {
        return service.update(id, body);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
