package com.phishguard.dashboard.controller;

import com.phishguard.dashboard.dto.DashboardSummaryDto;
import com.phishguard.dashboard.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    public DashboardSummaryDto summary(@RequestParam Long userId) {
        return dashboardService.summaryOrThrow(userId);
    }
}
