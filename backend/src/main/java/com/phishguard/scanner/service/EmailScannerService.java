package com.phishguard.scanner.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.phishguard.scanner.dto.EmailScanRequestDto;
import com.phishguard.scanner.dto.EmailScanResponseDto;
import com.phishguard.scanner.model.EmailScan;
import com.phishguard.scanner.repository.EmailScanRepository;
import com.phishguard.user.service.UserService;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class EmailScannerService {

    private final EmailScanRepository repository;
    private final UserService userService;
    private final ObjectMapper objectMapper;

    public EmailScannerService(
            EmailScanRepository repository, UserService userService, ObjectMapper objectMapper) {
        this.repository = repository;
        this.userService = userService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<EmailScanResponseDto> findAll(Long userId) {
        if (userId != null) {
            userService.getEntityOrThrow(userId);
            return repository.findByUserIdOrderByCreatedAtDesc(userId).stream().map(this::toDto).toList();
        }
        return repository.findAll().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public EmailScanResponseDto findById(Long id) {
        return repository.findById(id).map(this::toDto).orElseThrow(() -> notFound(id));
    }

    /** Rule-based scan (no external AI). Persists a row for history. */
    @Transactional
    public EmailScanResponseDto scan(EmailScanRequestDto dto) {
        if (dto.getUserId() != null) {
            userService.getEntityOrThrow(dto.getUserId());
        }

        if (dto.getRawContent() == null || dto.getRawContent().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "raw_content is required to scan");
        }

        String text = dto.getRawContent();
        String lower = text.toLowerCase(Locale.ROOT);

        int score = 0;
        List<String> suspicious = new ArrayList<>();
        List<Map<String, String>> findings = new ArrayList<>();

        score += rule(lower, "verify your account", 20, suspicious, findings, "warning", "Account verification language");
        score += rule(lower, "urgent", 10, suspicious, findings, "info", "Urgent tone");
        score += rule(lower, "wire transfer", 25, suspicious, findings, "warning", "Financial request");
        score += rule(lower, "gift card", 20, suspicious, findings, "warning", "Gift card scam pattern");
        score += rule(lower, "click here immediately", 15, suspicious, findings, "info", "Pushy call to action");
        score += rule(lower, "suspended", 15, suspicious, findings, "warning", "Account suspension threat");
        if (lower.contains("http://") || lower.contains("https://")) {
            score += 5;
            suspicious.add("url_in_body");
            findings.add(
                    finding("info", "Links present", "URLs can be benign or malicious; verify the domain carefully."));
        }

        score = Math.min(100, score);
        String status;
        if (score >= 70) {
            status = "dangerous";
        } else if (score >= 40) {
            status = "suspicious";
        } else {
            status = "safe";
        }

        String summary =
                "Heuristic scan only. Score "
                        + score
                        + "/100. "
                        + (suspicious.isEmpty()
                                ? "No strong phishing signals detected in the text."
                                : "Flagged patterns: "
                                        + String.join(", ", suspicious)
                                        + ".");

        EmailScan e = new EmailScan();
        if (dto.getUserId() != null) {
            e.setUser(userService.getEntityOrThrow(dto.getUserId()));
        }
        e.setSender(dto.getSender());
        e.setSubject(dto.getSubject());
        e.setRawContent(text);
        e.setScanType(dto.getScanType() != null ? dto.getScanType().toUpperCase(Locale.ROOT) : "EMAIL");
        e.setRiskScore(score);
        e.setStatus(status);
        e.setAiSummary(summary);
        e.setFindingsJson(writeJson(findings));
        try {
            e.setSuspiciousElementsJson(objectMapper.writeValueAsString(suspicious));
        } catch (JsonProcessingException ex) {
            e.setSuspiciousElementsJson("[]");
        }
        e.setCreatedAt(Instant.now());

        return toDto(repository.save(e));
    }

    @Transactional
    public EmailScanResponseDto update(Long id, EmailScanRequestDto dto) {
        EmailScan e = repository.findById(id).orElseThrow(() -> notFound(id));
        if (dto.getUserId() != null) {
            e.setUser(userService.getEntityOrThrow(dto.getUserId()));
        } else {
            e.setUser(null);
        }
        e.setSubject(dto.getSubject());
        e.setRawContent(dto.getRawContent());
        if (dto.getScanType() != null) {
            e.setScanType(dto.getScanType().toUpperCase(Locale.ROOT));
        }
        return toDto(repository.save(e));
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw notFound(id);
        }
        repository.deleteById(id);
    }

    private static int rule(
            String lower,
            String needle,
            int points,
            List<String> suspicious,
            List<Map<String, String>> findings,
            String type,
            String title) {
        if (lower.contains(needle)) {
            suspicious.add(needle);
            findings.add(finding(type, title, "Matched keyword or phrase: \"" + needle + "\"."));
            return points;
        }
        return 0;
    }

    private EmailScanResponseDto toDto(EmailScan e) {
        Instant at = e.getCreatedAt();
        return new EmailScanResponseDto(
                e.getId(),
                e.getUser() != null ? e.getUser().getId() : null,
                e.getSubject(),
                e.getSender(),
                e.getRawContent(),
                e.getScanType(),
                e.getRiskScore(),
                riskLevelFromScore(e.getRiskScore()),
                e.getStatus(),
                e.getAiSummary(),
                e.getFindingsJson(),
                e.getSuspiciousElementsJson(),
                at,
                at);
    }

    private static String riskLevelFromScore(int score) {
        if (score >= 70) {
            return "high";
        }
        if (score >= 40) {
            return "medium";
        }
        return "low";
    }

    private static Map<String, String> finding(String type, String title, String description) {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("type", type);
        m.put("title", title);
        m.put("description", description);
        return m;
    }

    private String writeJson(List<Map<String, String>> findings) {
        try {
            return objectMapper.writeValueAsString(findings);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    private static ResponseStatusException notFound(Long id) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Email scan not found: " + id);
    }
}
