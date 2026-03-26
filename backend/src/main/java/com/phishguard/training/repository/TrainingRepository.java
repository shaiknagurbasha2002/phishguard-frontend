package com.phishguard.training.repository;

import com.phishguard.training.model.Training;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrainingRepository extends JpaRepository<Training, Long> {

    long countByProgressGreaterThanEqual(int minProgress);
}
