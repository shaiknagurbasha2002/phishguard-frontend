package com.phishguard.scanner.controller;

import com.phishguard.scanner.dto.EmailScanRequestDto;
import com.phishguard.scanner.dto.EmailScanResponseDto;
import com.phishguard.scanner.service.EmailScannerService;
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
@RequestMapping("/api/email-scans")
public class EmailScannerController {

    private final EmailScannerService emailScannerService;

    public EmailScannerController(EmailScannerService emailScannerService) {
        this.emailScannerService = emailScannerService;
    }

    @GetMapping("/user/{userId}")
    public List<EmailScanResponseDto> listForUser(@PathVariable Long userId) {
        return emailScannerService.findAll(userId);
    }

    @GetMapping
    public List<EmailScanResponseDto> list(@RequestParam(required = false) Long userId) {
        return emailScannerService.findAll(userId);
    }

    @GetMapping("/{id}")
    public EmailScanResponseDto get(@PathVariable Long id) {
        return emailScannerService.findById(id);
    }

    /** Run heuristics and save scan history. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EmailScanResponseDto createScan(@Valid @RequestBody EmailScanRequestDto body) {
        return emailScannerService.scan(body);
    }

    /** @deprecated Use POST /api/email-scans */
    @PostMapping("/scan")
    @ResponseStatus(HttpStatus.CREATED)
    public EmailScanResponseDto scanLegacy(@Valid @RequestBody EmailScanRequestDto body) {
        return emailScannerService.scan(body);
    }

    @PutMapping("/{id}")
    public EmailScanResponseDto update(@PathVariable Long id, @Valid @RequestBody EmailScanRequestDto body) {
        return emailScannerService.update(id, body);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        emailScannerService.delete(id);
    }
}
