package com.phishguard.simulation.repository;

import com.phishguard.simulation.model.SimulationResult;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SimulationResultRepository extends JpaRepository<SimulationResult, Long> {

    List<SimulationResult> findByUserIdOrderByCreatedAtDesc(Long userId);

    long countByUserIdAndPassedTrue(Long userId);
}
