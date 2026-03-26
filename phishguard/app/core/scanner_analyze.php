<?php
/**
 * Server-side email analysis (rule-based). Updates email_scans and email_scan_findings.
 */
declare(strict_types=1);

function phishguard_analyze_email(PDO $pdo, int $scanId, string $content): void
{
    $pdo->prepare('UPDATE email_scans SET status = ? WHERE id = ?')->execute(['processing', $scanId]);

    $riskScore = 0;
    $findings = [];

    $lower = strtolower($content);
    if (preg_match('/\b(urgent|asap|verify\s+(your|account)|suspended|click\s+here|confirm\s+your)\b/i', $content)) {
        $findings[] = ['type' => 'urgency', 'severity' => 'medium', 'message' => 'Urgent or pressure language detected'];
        $riskScore += 25;
    }
    if (preg_match('/https?:\/\/[^\s<>"\']+/i', $content, $m)) {
        $findings[] = ['type' => 'link', 'severity' => 'low', 'message' => 'Contains links - verify URLs before clicking'];
        $riskScore += 10;
    }
    if (preg_match('/\b(password|login|credentials|social\s+security|bank\s+account)\b/i', $content)) {
        $findings[] = ['type' => 'sensitive_request', 'severity' => 'high', 'message' => 'Requests for sensitive information'];
        $riskScore += 35;
    }
    if (preg_match('/\b(dear\s+customer|valued\s+member|account\s+holder)\b/i', $content)) {
        $findings[] = ['type' => 'generic_greeting', 'severity' => 'low', 'message' => 'Generic greeting often used in phishing'];
        $riskScore += 10;
    }
    if (preg_match('/\b(nigerian|inheritance|lottery|prize|wire\s+transfer)\b/i', $content)) {
        $findings[] = ['type' => 'scam_keywords', 'severity' => 'critical', 'message' => 'Known scam keywords detected'];
        $riskScore += 40;
    }

    $riskScore = min(100, $riskScore);
    if (empty($findings)) {
        $findings[] = ['type' => 'clean', 'severity' => 'low', 'message' => 'No obvious phishing indicators found'];
    }

    $stmt = $pdo->prepare('INSERT INTO email_scan_findings (scan_id, type, severity, message, detail) VALUES (?, ?, ?, ?, ?)');
    foreach ($findings as $f) {
        $stmt->execute([$scanId, $f['type'], $f['severity'], $f['message'], $f['detail'] ?? null]);
    }
    $pdo->prepare('UPDATE email_scans SET risk_score = ?, status = ?, completed_at = NOW() WHERE id = ?')
        ->execute([$riskScore, 'completed', $scanId]);
}