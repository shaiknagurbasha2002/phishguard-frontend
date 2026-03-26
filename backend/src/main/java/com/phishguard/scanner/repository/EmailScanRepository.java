package com.phishguard.scanner.repository;

import com.phishguard.scanner.model.EmailScan;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailScanRepository extends JpaRepository<EmailScan, Long> {

    List<EmailScan> findByUserIdOrderByCreatedAtDesc(Long userId);

    long countByUserId(Long userId);
}
