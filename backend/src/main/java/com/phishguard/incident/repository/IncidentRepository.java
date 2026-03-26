package com.phishguard.incident.repository;

import com.phishguard.incident.model.Incident;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IncidentRepository extends JpaRepository<Incident, Long> {

    List<Incident> findByUserIdOrderByReportedAtDesc(Long userId);
}
