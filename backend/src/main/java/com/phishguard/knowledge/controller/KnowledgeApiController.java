package com.phishguard.knowledge.controller;

import com.phishguard.knowledge.dto.KnowledgeArticleDto;
import com.phishguard.knowledge.service.KnowledgeArticleService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public Knowledge Hub API (list + read by id). Admin CRUD remains on
 * {@link KnowledgeHubController} at /api/knowledge-hub/articles.
 */
@RestController
@RequestMapping("/api/knowledge")
public class KnowledgeApiController {

    private final KnowledgeArticleService service;

    public KnowledgeApiController(KnowledgeArticleService service) {
        this.service = service;
    }

    /** Published articles only for the hub. */
    @GetMapping
    public List<KnowledgeArticleDto> list() {
        return service.findAll(true);
    }

    @GetMapping("/{id}")
    public KnowledgeArticleDto get(@PathVariable Long id) {
        return service.findById(id);
    }
}
