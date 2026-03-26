package com.phishguard.leaderboard.service;

import com.phishguard.leaderboard.dto.LeaderboardEntryDto;
import com.phishguard.leaderboard.dto.LeaderboardResponseDto;
import com.phishguard.user.model.User;
import com.phishguard.user.repository.UserRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LeaderboardService {

    private final UserRepository userRepository;

    public LeaderboardService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public LeaderboardResponseDto buildLeaderboard(Integer limit) {
        List<User> users = new ArrayList<>(userRepository.findAll());
        users.sort(Comparator.comparingInt(User::getTotalPoints).reversed());

        int max = limit == null || limit <= 0 ? users.size() : Math.min(limit, users.size());
        List<LeaderboardEntryDto> entries = new ArrayList<>();
        for (int i = 0; i < max; i++) {
            User u = users.get(i);
            entries.add(
                    new LeaderboardEntryDto(i + 1, u.getId(), u.getName(), u.getEmail(), u.getTotalPoints()));
        }
        return new LeaderboardResponseDto(Instant.now(), entries);
    }
}
