package com.phishguard.simulation.repository;

import com.phishguard.simulation.model.Simulation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SimulationRepository extends JpaRepository<Simulation, Long> {
}
