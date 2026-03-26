package com.phishguard.training.service;

import com.phishguard.training.dto.TrainingRequestDto;
import com.phishguard.training.dto.TrainingResponseDto;
import com.phishguard.training.model.Training;
import com.phishguard.training.repository.TrainingRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TrainingService {

    private final TrainingRepository trainingRepository;

    public TrainingService(TrainingRepository trainingRepository) {
        this.trainingRepository = trainingRepository;
    }

    @Transactional(readOnly = true)
    public List<TrainingResponseDto> findAll() {
        return trainingRepository.findAll().stream().map(this::toDto).toList();
    }

    @Transactional
    public TrainingResponseDto create(TrainingRequestDto dto) {
        Training t = new Training();
        t.setTitle(dto.getTitle().trim());
        t.setDescription(dto.getDescription());
        int p = dto.getProgress() == null ? 0 : dto.getProgress();
        t.setProgress(Math.max(0, Math.min(100, p)));
        return toDto(trainingRepository.save(t));
    }

    private TrainingResponseDto toDto(Training t) {
        return new TrainingResponseDto(t.getId(), t.getTitle(), t.getDescription(), t.getProgress());
    }
}
