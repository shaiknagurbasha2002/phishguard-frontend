package com.phishguard.knowledge.controller;

import com.phishguard.knowledge.dto.KnowledgeArticleDto;
import com.phishguard.knowledge.dto.KnowledgeArticleRequestDto;
import com.phishguard.knowledge.service.KnowledgeArticleService;
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
@RequestMapping("/api/knowledge-hub/articles")
public class KnowledgeHubController {

    private final KnowledgeArticleService service;

    public KnowledgeHubController(KnowledgeArticleService service) {
        this.service = service;
    }

    @GetMapping
    public List<KnowledgeArticleDto> list(@RequestParam(required = false) Boolean publishedOnly) {
        return service.findAll(publishedOnly);
    }

    @GetMapping("/{id}")
    public KnowledgeArticleDto get(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public KnowledgeArticleDto create(@Valid @RequestBody KnowledgeArticleRequestDto body) {
        return service.create(body);
    }

    @PutMapping("/{id}")
    public KnowledgeArticleDto update(@PathVariable Long id, @Valid @RequestBody KnowledgeArticleRequestDto body) {
        return service.update(id, body);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
