package com.phishguard.simulation.service;

import com.phishguard.simulation.dto.SimulationDto;
import com.phishguard.simulation.dto.SimulationRequestDto;
import com.phishguard.simulation.model.Simulation;
import com.phishguard.simulation.repository.SimulationRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SimulationService {

    private final SimulationRepository repository;

    public SimulationService(SimulationRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<SimulationDto> findAll() {
        return repository.findAll().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public SimulationDto findById(Long id) {
        return repository.findById(id).map(this::toDto).orElseThrow(() -> notFound(id));
    }

    @Transactional
    public SimulationDto create(SimulationRequestDto dto) {
        Simulation s = new Simulation();
        apply(dto, s);
        return toDto(repository.save(s));
    }

    @Transactional
    public SimulationDto update(Long id, SimulationRequestDto dto) {
        Simulation s = repository.findById(id).orElseThrow(() -> notFound(id));
        apply(dto, s);
        return toDto(repository.save(s));
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw notFound(id);
        }
        repository.deleteById(id);
    }

    public Simulation getEntityOrThrow(Long id) {
        return repository.findById(id).orElseThrow(() -> notFound(id));
    }

    private void apply(SimulationRequestDto dto, Simulation s) {
        s.setTitle(dto.getTitle().trim());
        s.setDescription(dto.getDescription());
        s.setType(dto.getType());
        if (dto.getStatus() != null && !dto.getStatus().isBlank()) {
            s.setStatus(dto.getStatus().trim());
        }
    }

    private SimulationDto toDto(Simulation s) {
        return new SimulationDto(
                s.getId(), s.getTitle(), s.getDescription(), s.getType(), s.getStatus(), s.getCreatedAt());
    }

    private static ResponseStatusException notFound(Long id) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Simulation not found: " + id);
    }
}
