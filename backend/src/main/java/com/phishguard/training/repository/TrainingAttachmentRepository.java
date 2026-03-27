package com.phishguard.training.repository;

import com.phishguard.training.model.TrainingAttachment;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrainingAttachmentRepository extends JpaRepository<TrainingAttachment, Long> {

    Optional<TrainingAttachment> findByIdAndTraining_Id(Long id, Long trainingId);
}
