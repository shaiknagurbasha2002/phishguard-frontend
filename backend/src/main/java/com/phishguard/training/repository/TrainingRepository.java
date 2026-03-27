package com.phishguard.training.repository;

import com.phishguard.training.model.Training;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
public interface TrainingRepository extends JpaRepository<Training, Long> {

    long countByProgressGreaterThanEqual(int minProgress);

    @EntityGraph(attributePaths = {"attachments"})
    @Override
    List<Training> findAll();

    @EntityGraph(attributePaths = {"attachments"})
    @Override
    Optional<Training> findById(Long id);
}
