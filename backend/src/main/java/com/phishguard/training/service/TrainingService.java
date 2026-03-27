package com.phishguard.training.service;

import com.phishguard.training.dto.TrainingAttachmentDto;
import com.phishguard.training.dto.TrainingAttachmentRequestDto;
import com.phishguard.training.dto.TrainingRequestDto;
import com.phishguard.training.dto.TrainingResponseDto;
import com.phishguard.training.model.Training;
import com.phishguard.training.model.TrainingAttachment;
import com.phishguard.training.repository.TrainingAttachmentRepository;
import com.phishguard.training.repository.TrainingRepository;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TrainingService {

    private final TrainingRepository trainingRepository;
    private final TrainingAttachmentRepository trainingAttachmentRepository;

    public TrainingService(
            TrainingRepository trainingRepository,
            TrainingAttachmentRepository trainingAttachmentRepository) {
        this.trainingRepository = trainingRepository;
        this.trainingAttachmentRepository = trainingAttachmentRepository;
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

    @Transactional
    public TrainingResponseDto addAttachment(Long trainingId, TrainingAttachmentRequestDto dto) {
        Training t = trainingRepository
                .findById(trainingId)
                .orElseThrow(() -> new IllegalArgumentException("Training not found: " + trainingId));
        TrainingAttachment a = new TrainingAttachment();
        a.setTraining(t);
        a.setFileUrl(dto.getFileUrl().trim());
        a.setFileName(dto.getFileName().trim());
        if (dto.getFileSize() != null && !dto.getFileSize().isBlank()) {
            try {
                a.setFileSize(Long.parseLong(dto.getFileSize().trim()));
            } catch (NumberFormatException e) {
                a.setFileSize(null);
            }
        }
        t.getAttachments().add(a);
        return toDto(trainingRepository.save(t));
    }

    @Transactional
    public void deleteAttachment(Long trainingId, Long attachmentId) {
        if (!trainingRepository.existsById(trainingId)) {
            throw new IllegalArgumentException("Training not found: " + trainingId);
        }
        TrainingAttachment att = trainingAttachmentRepository
                .findByIdAndTraining_Id(attachmentId, trainingId)
                .orElseThrow(() -> new IllegalArgumentException("Attachment not found: " + attachmentId));
        trainingAttachmentRepository.delete(att);
    }

    @Transactional
    public void deleteTraining(Long id) {
        if (!trainingRepository.existsById(id)) {
            throw new IllegalArgumentException("Training not found: " + id);
        }
        trainingRepository.deleteById(id);
    }

    private TrainingResponseDto toDto(Training t) {
        List<TrainingAttachmentDto> atts = t.getAttachments().stream()
                .sorted(Comparator.comparing(TrainingAttachment::getId, Comparator.nullsFirst(Comparator.naturalOrder())))
                .map(att -> new TrainingAttachmentDto(
                        att.getId(),
                        att.getFileName(),
                        att.getFileUrl(),
                        att.getFileSize(),
                        att.getUploadedAt()))
                .toList();
        return new TrainingResponseDto(t.getId(), t.getTitle(), t.getDescription(), t.getProgress(), atts);
    }
}
