package com.phishguard.quiz.controller;

import com.phishguard.quiz.dto.QuizQuestionDto;
import com.phishguard.quiz.dto.QuizQuestionRequestDto;
import com.phishguard.quiz.service.QuizQuestionService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/quiz-questions")
public class QuizQuestionController {

    private final QuizQuestionService service;

    public QuizQuestionController(QuizQuestionService service) {
        this.service = service;
    }

    @GetMapping
    public List<QuizQuestionDto> list(@RequestParam(required = false) Long quizId) {
        return service.findAll(quizId);
    }

    @GetMapping("/{id}")
    public QuizQuestionDto get(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public QuizQuestionDto create(@Valid @RequestBody QuizQuestionRequestDto body) {
        return service.create(body);
    }

    @PutMapping("/{id}")
    public QuizQuestionDto update(@PathVariable Long id, @Valid @RequestBody QuizQuestionRequestDto body) {
        return service.update(id, body);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
