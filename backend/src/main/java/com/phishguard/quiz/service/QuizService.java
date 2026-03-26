package com.phishguard.quiz.service;

import com.phishguard.quiz.dto.QuizDto;
import com.phishguard.quiz.dto.QuizRequestDto;
import com.phishguard.quiz.model.Quiz;
import com.phishguard.quiz.model.QuizQuestion;
import com.phishguard.quiz.repository.QuizQuestionRepository;
import com.phishguard.quiz.repository.QuizRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class QuizService {

    private final QuizRepository quizRepository;
    private final QuizQuestionRepository questionRepository;

    public QuizService(QuizRepository quizRepository, QuizQuestionRepository questionRepository) {
        this.quizRepository = quizRepository;
        this.questionRepository = questionRepository;
    }

    @Transactional(readOnly = true)
    public List<QuizDto> findAll() {
        return quizRepository.findAll().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public QuizDto findById(Long id) {
        return quizRepository.findById(id).map(this::toDto).orElseThrow(() -> notFound(id));
    }

    @Transactional
    public QuizDto create(QuizRequestDto dto) {
        Quiz q = new Quiz();
        apply(dto, q);
        return toDto(quizRepository.save(q));
    }

    @Transactional
    public QuizDto update(Long id, QuizRequestDto dto) {
        Quiz q = quizRepository.findById(id).orElseThrow(() -> notFound(id));
        apply(dto, q);
        return toDto(quizRepository.save(q));
    }

    @Transactional
    public void delete(Long id) {
        if (!quizRepository.existsById(id)) {
            throw notFound(id);
        }
        quizRepository.deleteById(id);
    }

    public Quiz getEntityOrThrow(Long id) {
        return quizRepository.findById(id).orElseThrow(() -> notFound(id));
    }

    private void apply(QuizRequestDto dto, Quiz q) {
        q.setTitle(dto.getTitle().trim());
        q.setDescription(dto.getDescription());
        q.setPassingScorePercent(dto.getPassingScorePercent());
    }

    private QuizDto toDto(Quiz q) {
        QuizDto d = new QuizDto(q.getId(), q.getTitle(), q.getDescription(), q.getPassingScorePercent());
        List<QuizQuestion> qs = questionRepository.findByQuizIdOrderBySortOrderAscIdAsc(q.getId());
        if (!qs.isEmpty()) {
            QuizQuestion first = qs.get(0);
            d.setQuestion(first.getQuestionText());
            d.setOptionA(first.getOptionA());
            d.setOptionB(first.getOptionB());
            d.setOptionC(first.getOptionC());
            d.setOptionD(first.getOptionD());
        }
        return d;
    }

    private static ResponseStatusException notFound(Long id) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found: " + id);
    }
}
