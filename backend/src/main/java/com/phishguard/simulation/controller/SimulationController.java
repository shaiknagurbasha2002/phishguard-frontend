package com.phishguard.simulation.controller;

import com.phishguard.simulation.dto.SimulationDto;
import com.phishguard.simulation.dto.SimulationRequestDto;
import com.phishguard.simulation.service.SimulationService;
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
@RequestMapping("/api/simulations")
public class SimulationController {

    private final SimulationService simulationService;

    public SimulationController(SimulationService simulationService) {
        this.simulationService = simulationService;
    }

    @GetMapping
    public List<SimulationDto> list() {
        return simulationService.findAll();
    }

    @GetMapping("/{id}")
    public SimulationDto get(@PathVariable Long id) {
        return simulationService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SimulationDto create(@Valid @RequestBody SimulationRequestDto body) {
        return simulationService.create(body);
    }

    @PutMapping("/{id}")
    public SimulationDto update(@PathVariable Long id, @Valid @RequestBody SimulationRequestDto body) {
        return simulationService.update(id, body);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        simulationService.delete(id);
    }
}
