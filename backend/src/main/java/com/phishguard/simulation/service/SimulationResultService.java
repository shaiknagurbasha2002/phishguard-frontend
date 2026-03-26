package com.phishguard.simulation.service;

import com.phishguard.simulation.dto.SimulationResultDto;
import com.phishguard.simulation.dto.SimulationResultRequestDto;
import com.phishguard.simulation.model.SimulationResult;
import com.phishguard.simulation.repository.SimulationRepository;
import com.phishguard.simulation.repository.SimulationResultRepository;
import com.phishguard.user.service.UserService;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SimulationResultService {

    private static final int POINTS_ON_PASS = 15;

    private final SimulationResultRepository resultRepository;
    private final SimulationRepository simulationRepository;
    private final UserService userService;

    public SimulationResultService(
            SimulationResultRepository resultRepository,
            SimulationRepository simulationRepository,
            UserService userService) {
        this.resultRepository = resultRepository;
        this.simulationRepository = simulationRepository;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public List<SimulationResultDto> findAll(Long userId) {
        if (userId != null) {
            userService.getEntityOrThrow(userId);
            return resultRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                    .map(this::toDto)
                    .toList();
        }
        return resultRepository.findAll().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public SimulationResultDto findById(Long id) {
        return resultRepository.findById(id).map(this::toDto).orElseThrow(() -> notFound(id));
    }

    @Transactional
    public SimulationResultDto create(SimulationResultRequestDto dto) {
        userService.getEntityOrThrow(dto.getUserId());
        var sim =
                simulationRepository
                        .findById(dto.getSimulationId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Simulation not found"));
        SimulationResult r = new SimulationResult();
        r.setUser(userService.getEntityOrThrow(dto.getUserId()));
        r.setSimulation(sim);
        r.setScorePercent(clamp(dto.getScorePercent()));
        r.setPassed(Boolean.TRUE.equals(dto.getPassed()));
        r.setDetails(dto.getDetails());
        r.setCreatedAt(Instant.now());
        SimulationResult saved = resultRepository.save(r);
        if (Boolean.TRUE.equals(saved.getPassed())) {
            userService.addPoints(dto.getUserId(), POINTS_ON_PASS);
        }
        return toDto(saved);
    }

    @Transactional
    public SimulationResultDto update(Long id, SimulationResultRequestDto dto) {
        SimulationResult r = resultRepository.findById(id).orElseThrow(() -> notFound(id));
        userService.getEntityOrThrow(dto.getUserId());
        var sim =
                simulationRepository
                        .findById(dto.getSimulationId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Simulation not found"));
        r.setUser(userService.getEntityOrThrow(dto.getUserId()));
        r.setSimulation(sim);
        r.setScorePercent(clamp(dto.getScorePercent()));
        r.setPassed(Boolean.TRUE.equals(dto.getPassed()));
        r.setDetails(dto.getDetails());
        return toDto(resultRepository.save(r));
    }

    @Transactional
    public void delete(Long id) {
        if (!resultRepository.existsById(id)) {
            throw notFound(id);
        }
        resultRepository.deleteById(id);
    }

    private SimulationResultDto toDto(SimulationResult r) {
        return new SimulationResultDto(
                r.getId(),
                r.getUser().getId(),
                r.getSimulation().getId(),
                r.getScorePercent(),
                r.getPassed(),
                r.getDetails(),
                r.getCreatedAt());
    }

    private static int clamp(int v) {
        return Math.max(0, Math.min(100, v));
    }

    private static ResponseStatusException notFound(Long id) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Simulation result not found: " + id);
    }

}
