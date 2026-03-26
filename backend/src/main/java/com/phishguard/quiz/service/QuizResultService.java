package com.phishguard.quiz.service;

import com.phishguard.quiz.dto.QuizResultDto;
import com.phishguard.quiz.dto.QuizResultRequestDto;
import com.phishguard.quiz.dto.QuizSubmitRequestDto;
import com.phishguard.quiz.model.Quiz;
import com.phishguard.quiz.model.QuizQuestion;
import com.phishguard.quiz.model.QuizResult;
import com.phishguard.quiz.repository.QuizQuestionRepository;
import com.phishguard.quiz.repository.QuizRepository;
import com.phishguard.quiz.repository.QuizResultRepository;
import com.phishguard.user.service.UserService;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class QuizResultService {

    private static final int POINTS_ON_PASS = 10;

    private final QuizResultRepository resultRepository;
    private final QuizRepository quizRepository;
    private final QuizQuestionRepository questionRepository;
    private final UserService userService;

    public QuizResultService(
            QuizResultRepository resultRepository,
            QuizRepository quizRepository,
            QuizQuestionRepository questionRepository,
            UserService userService) {
        this.resultRepository = resultRepository;
        this.quizRepository = quizRepository;
        this.questionRepository = questionRepository;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public List<QuizResultDto> findAll(Long userId, Long quizId) {
        if (userId != null) {
            userService.getEntityOrThrow(userId);
            return resultRepository.findByUserIdOrderBySubmittedAtDesc(userId).stream()
                    .map(this::toDto)
                    .toList();
        }
        if (quizId != null) {
            quizRepository.findById(quizId).orElseThrow(() -> quizNotFound(quizId));
            return resultRepository.findByQuizIdOrderBySubmittedAtDesc(quizId).stream()
                    .map(this::toDto)
                    .toList();
        }
        return resultRepository.findAll().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public QuizResultDto findById(Long id) {
        return resultRepository.findById(id).map(this::toDto).orElseThrow(() -> notFound(id));
    }

    @Transactional
    public QuizResultDto create(QuizResultRequestDto dto) {
        userService.getEntityOrThrow(dto.getUserId());
        Quiz quiz = quizRepository.findById(dto.getQuizId()).orElseThrow(() -> quizNotFound(dto.getQuizId()));
        QuizResult r = new QuizResult();
        r.setUser(userService.getEntityOrThrow(dto.getUserId()));
        r.setQuiz(quiz);
        r.setScorePercent(clampPercent(dto.getScorePercent()));
        r.setPassed(Boolean.TRUE.equals(dto.getPassed()));
        r.setSubmittedAt(Instant.now());
        return toDto(resultRepository.save(r));
    }

    @Transactional
    public QuizResultDto update(Long id, QuizResultRequestDto dto) {
        QuizResult r = resultRepository.findById(id).orElseThrow(() -> notFound(id));
        userService.getEntityOrThrow(dto.getUserId());
        Quiz quiz = quizRepository.findById(dto.getQuizId()).orElseThrow(() -> quizNotFound(dto.getQuizId()));
        r.setUser(userService.getEntityOrThrow(dto.getUserId()));
        r.setQuiz(quiz);
        r.setScorePercent(clampPercent(dto.getScorePercent()));
        r.setPassed(Boolean.TRUE.equals(dto.getPassed()));
        return toDto(resultRepository.save(r));
    }

    @Transactional
    public void delete(Long id) {
        if (!resultRepository.existsById(id)) {
            throw notFound(id);
        }
        resultRepository.deleteById(id);
    }

    @Transactional
    public QuizResultDto submit(Long quizId, QuizSubmitRequestDto dto) {
        userService.getEntityOrThrow(dto.getUserId());
        Quiz quiz = quizRepository.findById(quizId).orElseThrow(() -> quizNotFound(quizId));
        List<QuizQuestion> questions = questionRepository.findByQuizIdOrderBySortOrderAscIdAsc(quizId);
        if (questions.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quiz has no questions");
        }

        Map<Long, String> answers = new HashMap<>();
        for (var a : dto.getAnswers()) {
            answers.put(a.getQuestionId(), a.getChoice().trim().toUpperCase());
        }

        int correct = 0;
        for (QuizQuestion q : questions) {
            String picked = answers.get(q.getId());
            if (picked != null && picked.equals(q.getCorrectOption())) {
                correct++;
            }
        }

        int scorePercent = (int) Math.round(100.0 * correct / questions.size());
        boolean passed = scorePercent >= quiz.getPassingScorePercent();

        QuizResult r = new QuizResult();
        r.setUser(userService.getEntityOrThrow(dto.getUserId()));
        r.setQuiz(quiz);
        r.setScorePercent(scorePercent);
        r.setPassed(passed);
        r.setSubmittedAt(Instant.now());
        QuizResult saved = resultRepository.save(r);

        if (passed) {
            userService.addPoints(dto.getUserId(), POINTS_ON_PASS);
        }

        return toDto(saved);
    }

    private QuizResultDto toDto(QuizResult r) {
        return new QuizResultDto(
                r.getId(),
                r.getUser().getId(),
                r.getQuiz().getId(),
                r.getScorePercent(),
                r.getPassed(),
                r.getSubmittedAt());
    }

    private static int clampPercent(int v) {
        return Math.max(0, Math.min(100, v));
    }

    private static ResponseStatusException notFound(Long id) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz result not found: " + id);
    }

    private static ResponseStatusException quizNotFound(Long id) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found: " + id);
    }
}
