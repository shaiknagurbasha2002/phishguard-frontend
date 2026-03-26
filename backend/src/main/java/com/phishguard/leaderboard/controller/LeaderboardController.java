package com.phishguard.leaderboard.controller;

import com.phishguard.leaderboard.dto.LeaderboardResponseDto;
import com.phishguard.leaderboard.service.LeaderboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    public LeaderboardController(LeaderboardService leaderboardService) {
        this.leaderboardService = leaderboardService;
    }

    /** Sorted by {@code total_points} descending. Optional {@code limit} (default: all). */
    @GetMapping
    public LeaderboardResponseDto get(@RequestParam(required = false) Integer limit) {
        return leaderboardService.buildLeaderboard(limit);
    }
}
