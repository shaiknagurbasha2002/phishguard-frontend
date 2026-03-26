package com.phishguard.quiz.repository;

import com.phishguard.quiz.model.QuizQuestion;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, Long> {

    List<QuizQuestion> findByQuizIdOrderBySortOrderAscIdAsc(Long quizId);
}
