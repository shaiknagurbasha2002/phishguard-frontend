package com.phishguard.training.controller;

import com.phishguard.training.dto.TrainingAttachmentRequestDto;
import com.phishguard.training.dto.TrainingRequestDto;
import com.phishguard.training.dto.TrainingResponseDto;
import com.phishguard.training.service.TrainingService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/training")
public class TrainingController {

    private final TrainingService trainingService;

    public TrainingController(TrainingService trainingService) {
        this.trainingService = trainingService;
    }

    @GetMapping
    public List<TrainingResponseDto> list() {
        return trainingService.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TrainingResponseDto create(@Valid @RequestBody TrainingRequestDto body) {
        return trainingService.create(body);
    }

    @PostMapping("/{id}/attachments")
    public TrainingResponseDto addAttachment(
            @PathVariable Long id,
            @Valid @RequestBody TrainingAttachmentRequestDto body) {
        try {
            return trainingService.addAttachment(id, body);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    @DeleteMapping("/{moduleId}/attachments/{attachmentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAttachment(@PathVariable Long moduleId, @PathVariable Long attachmentId) {
        try {
            trainingService.deleteAttachment(moduleId, attachmentId);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        try {
            trainingService.deleteTraining(id);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }
}
