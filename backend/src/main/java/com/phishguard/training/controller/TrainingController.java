package com.phishguard.training.controller;

import com.phishguard.training.dto.TrainingRequestDto;
import com.phishguard.training.dto.TrainingResponseDto;
import com.phishguard.training.service.TrainingService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

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
}
