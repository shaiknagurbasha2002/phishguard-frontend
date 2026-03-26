package com.phishguard.knowledge.service;

import com.phishguard.knowledge.dto.KnowledgeArticleDto;
import com.phishguard.knowledge.dto.KnowledgeArticleRequestDto;
import com.phishguard.knowledge.model.KnowledgeArticle;
import com.phishguard.knowledge.repository.KnowledgeArticleRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class KnowledgeArticleService {

    private final KnowledgeArticleRepository repository;

    public KnowledgeArticleService(KnowledgeArticleRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<KnowledgeArticleDto> findAll(Boolean publishedOnly) {
        if (Boolean.TRUE.equals(publishedOnly)) {
            return repository.findByPublishedTrue().stream().map(this::toDto).toList();
        }
        return repository.findAll().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public KnowledgeArticleDto findById(Long id) {
        return repository.findById(id).map(this::toDto).orElseThrow(() -> notFound(id));
    }

    @Transactional
    public KnowledgeArticleDto create(KnowledgeArticleRequestDto dto) {
        KnowledgeArticle a = new KnowledgeArticle();
        apply(dto, a);
        return toDto(repository.save(a));
    }

    @Transactional
    public KnowledgeArticleDto update(Long id, KnowledgeArticleRequestDto dto) {
        KnowledgeArticle a = repository.findById(id).orElseThrow(() -> notFound(id));
        apply(dto, a);
        return toDto(repository.save(a));
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw notFound(id);
        }
        repository.deleteById(id);
    }

    private void apply(KnowledgeArticleRequestDto dto, KnowledgeArticle a) {
        a.setTitle(dto.getTitle().trim());
        a.setSummary(dto.getSummary());
        a.setContent(dto.getContent());
        a.setCategory(dto.getCategory());
        a.setAuthor(dto.getAuthor());
        boolean nextPublished = Boolean.TRUE.equals(dto.getPublished());
        if (nextPublished && !Boolean.TRUE.equals(a.getPublished()) && a.getPublishedAt() == null) {
            a.setPublishedAt(Instant.now());
        }
        a.setPublished(nextPublished);
    }

    private KnowledgeArticleDto toDto(KnowledgeArticle a) {
        return new KnowledgeArticleDto(
                a.getId(),
                a.getTitle(),
                a.getSummary(),
                a.getContent(),
                a.getCategory(),
                a.getAuthor(),
                a.getPublished(),
                a.getPublishedAt());
    }

    private static ResponseStatusException notFound(Long id) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Knowledge article not found: " + id);
    }
}
