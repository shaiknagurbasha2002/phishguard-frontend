package com.phishguard.knowledge.repository;

import com.phishguard.knowledge.model.KnowledgeArticle;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KnowledgeArticleRepository extends JpaRepository<KnowledgeArticle, Long> {

    List<KnowledgeArticle> findByPublishedTrue();
}
