package com.phishguard.quiz.service;

import com.phishguard.quiz.dto.QuizQuestionDto;
import com.phishguard.quiz.dto.QuizQuestionRequestDto;
import com.phishguard.quiz.model.QuizQuestion;
import com.phishguard.quiz.repository.QuizQuestionRepository;
import com.phishguard.quiz.repository.QuizRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class QuizQuestionService {

    private final QuizQuestionRepository questionRepository;
    private final QuizRepository quizRepository;

    public QuizQuestionService(QuizQuestionRepository questionRepository, QuizRepository quizRepository) {
        this.questionRepository = questionRepository;
        this.quizRepository = quizRepository;
    }

    @Transactional(readOnly = true)
    public List<QuizQuestionDto> findAll(Long quizId) {
        if (quizId != null) {
            quizRepository.findById(quizId).orElseThrow(() -> quizNotFound(quizId));
            return questionRepository.findByQuizIdOrderBySortOrderAscIdAsc(quizId).stream()
                    .map(this::toDto)
                    .toList();
        }
        return questionRepository.findAll().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public QuizQuestionDto findById(Long id) {
        return questionRepository.findById(id).map(this::toDto).orElseThrow(() -> notFound(id));
    }

    @Transactional
    public QuizQuestionDto create(QuizQuestionRequestDto dto) {
        quizRepository.findById(dto.getQuizId()).orElseThrow(() -> quizNotFound(dto.getQuizId()));
        QuizQuestion q = new QuizQuestion();
        apply(dto, q);
        return toDto(questionRepository.save(q));
    }

    @Transactional
    public QuizQuestionDto update(Long id, QuizQuestionRequestDto dto) {
        QuizQuestion q = questionRepository.findById(id).orElseThrow(() -> notFound(id));
        quizRepository.findById(dto.getQuizId()).orElseThrow(() -> quizNotFound(dto.getQuizId()));
        apply(dto, q);
        return toDto(questionRepository.save(q));
    }

    @Transactional
    public void delete(Long id) {
        if (!questionRepository.existsById(id)) {
            throw notFound(id);
        }
        questionRepository.deleteById(id);
    }

    private void apply(QuizQuestionRequestDto dto, QuizQuestion q) {
        q.setQuiz(quizRepository.findById(dto.getQuizId()).orElseThrow(() -> quizNotFound(dto.getQuizId())));
        q.setQuestionText(dto.getQuestionText().trim());
        q.setOptionA(dto.getOptionA().trim());
        q.setOptionB(dto.getOptionB().trim());
        q.setOptionC(dto.getOptionC().trim());
        q.setOptionD(dto.getOptionD().trim());
        q.setCorrectOption(dto.getCorrectOption().trim().toUpperCase());
        q.setSortOrder(dto.getSortOrder());
    }

    private QuizQuestionDto toDto(QuizQuestion q) {
        return new QuizQuestionDto(
                q.getId(),
                q.getQuiz().getId(),
                q.getQuestionText(),
                q.getOptionA(),
                q.getOptionB(),
                q.getOptionC(),
                q.getOptionD(),
                q.getCorrectOption(),
                q.getSortOrder());
    }

    private static ResponseStatusException notFound(Long id) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz question not found: " + id);
    }

    private static ResponseStatusException quizNotFound(Long id) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found: " + id);
    }
}
