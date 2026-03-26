package com.phishguard.quiz.controller;

import com.phishguard.quiz.dto.QuizDto;
import com.phishguard.quiz.dto.QuizRequestDto;
import com.phishguard.quiz.dto.QuizResultDto;
import com.phishguard.quiz.dto.QuizSubmitRequestDto;
import com.phishguard.quiz.service.QuizResultService;
import com.phishguard.quiz.service.QuizService;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/quizzes")
public class QuizController {

    private final QuizService quizService;
    private final QuizResultService quizResultService;

    public QuizController(QuizService quizService, QuizResultService quizResultService) {
        this.quizService = quizService;
        this.quizResultService = quizResultService;
    }

    @GetMapping
    public List<QuizDto> list() {
        return quizService.findAll();
    }

    @GetMapping("/{id}")
    public QuizDto get(@PathVariable Long id) {
        return quizService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public QuizDto create(@Valid @RequestBody QuizRequestDto body) {
        return quizService.create(body);
    }

    @PutMapping("/{id}")
    public QuizDto update(@PathVariable Long id, @Valid @RequestBody QuizRequestDto body) {
        return quizService.update(id, body);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        quizService.delete(id);
    }

    /** Grade answers and store a {@link com.phishguard.quiz.model.QuizResult}. */
    @PostMapping("/{quizId}/submit")
    @ResponseStatus(HttpStatus.CREATED)
    public QuizResultDto submit(@PathVariable Long quizId, @Valid @RequestBody QuizSubmitRequestDto body) {
        return quizResultService.submit(quizId, body);
    }
}
