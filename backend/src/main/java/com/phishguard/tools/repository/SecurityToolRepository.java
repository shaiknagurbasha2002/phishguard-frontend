package com.phishguard.tools.repository;

import com.phishguard.tools.model.SecurityTool;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SecurityToolRepository extends JpaRepository<SecurityTool, Long> {
}
