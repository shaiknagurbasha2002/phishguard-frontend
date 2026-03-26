package com.phishguard.dashboard.service;

import com.phishguard.dashboard.dto.DashboardSummaryDto;
import com.phishguard.incident.repository.IncidentReportRepository;
import com.phishguard.quiz.repository.QuizResultRepository;
import com.phishguard.scanner.repository.EmailScanRepository;
import com.phishguard.simulation.repository.SimulationResultRepository;
import com.phishguard.training.repository.TrainingRepository;
import com.phishguard.user.model.User;
import com.phishguard.user.repository.UserRepository;
import com.phishguard.user.service.UserService;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DashboardService {

    private final UserService userService;
    private final UserRepository userRepository;
    private final TrainingRepository trainingRepository;
    private final QuizResultRepository quizResultRepository;
    private final SimulationResultRepository simulationResultRepository;
    private final EmailScanRepository emailScanRepository;
    private final IncidentReportRepository incidentReportRepository;

    public DashboardService(
            UserService userService,
            UserRepository userRepository,
            TrainingRepository trainingRepository,
            QuizResultRepository quizResultRepository,
            SimulationResultRepository simulationResultRepository,
            EmailScanRepository emailScanRepository,
            IncidentReportRepository incidentReportRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.trainingRepository = trainingRepository;
        this.quizResultRepository = quizResultRepository;
        this.simulationResultRepository = simulationResultRepository;
        this.emailScanRepository = emailScanRepository;
        this.incidentReportRepository = incidentReportRepository;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryDto summaryForUser(Long userId) {
        User user = userService.getEntityOrThrow(userId);

        List<User> ranked = new ArrayList<>(userRepository.findAll());
        ranked.sort(Comparator.comparingInt(User::getTotalPoints).reversed());
        int rank = -1;
        for (int i = 0; i < ranked.size(); i++) {
            if (ranked.get(i).getId().equals(userId)) {
                rank = i + 1;
                break;
            }
        }

        long modulesTotal = trainingRepository.count();
        long modulesDone = trainingRepository.countByProgressGreaterThanEqual(100);

        var quizResults = quizResultRepository.findByUserIdOrderBySubmittedAtDesc(userId);
        long quizAttempts = quizResults.size();
        Integer bestQuiz = null;
        if (!quizResults.isEmpty()) {
            bestQuiz = quizResults.stream().mapToInt(r -> r.getScorePercent()).max().getAsInt();
        }

        long simDone = simulationResultRepository.countByUserIdAndPassedTrue(userId);
        long scans = emailScanRepository.countByUserId(userId);
        long openIncidents = incidentReportRepository.countByStatusIgnoreCase("OPEN");

        DashboardSummaryDto d = new DashboardSummaryDto();
        d.setUserId(user.getId());
        d.setFullName(user.getName());
        d.setEmail(user.getEmail());
        d.setTotalPoints(user.getTotalPoints());
        d.setLeaderboardRank(rank > 0 ? rank : null);
        d.setTotalUsers(userRepository.count());
        d.setTrainingModulesTotal(modulesTotal);
        d.setTrainingModulesCompleted(modulesDone);
        d.setQuizAttempts(quizAttempts);
        d.setQuizBestScorePercent(bestQuiz);
        d.setSimulationsCompleted(simDone);
        d.setEmailScansCount(scans);
        d.setOpenIncidentsGlobal(openIncidents);
        return d;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryDto summaryOrThrow(Long userId) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId query parameter is required");
        }
        return summaryForUser(userId);
    }
}
