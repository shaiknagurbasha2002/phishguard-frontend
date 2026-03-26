package com.phishguard.quiz.repository;

import com.phishguard.quiz.model.QuizResult;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuizResultRepository extends JpaRepository<QuizResult, Long> {

    List<QuizResult> findByUserIdOrderBySubmittedAtDesc(Long userId);

    List<QuizResult> findByQuizIdOrderBySubmittedAtDesc(Long quizId);

    Optional<QuizResult> findFirstByUserIdAndQuizIdOrderByScorePercentDesc(Long userId, Long quizId);
}
