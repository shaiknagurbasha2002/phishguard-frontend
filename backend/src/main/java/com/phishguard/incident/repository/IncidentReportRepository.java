package com.phishguard.incident.repository;

import com.phishguard.incident.model.IncidentReport;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IncidentReportRepository extends JpaRepository<IncidentReport, Long> {

    List<IncidentReport> findByUserIdOrderByCreatedAtDesc(Long userId);

    long countByStatusIgnoreCase(String status);
}
