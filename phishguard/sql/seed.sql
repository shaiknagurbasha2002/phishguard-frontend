-- PhishGuard Seed Data
-- Run after schema.sql.
-- Default credentials (hash below = "password"): change via app or run scripts/set_passwords.php
--   admin:   admin@phishguard.local / password
--   student: student@phishguard.local / password

SET NAMES utf8mb4;

-- Roles
INSERT INTO `roles` (`id`, `name`, `description`) VALUES
(1, 'admin', 'Administrator'),
(2, 'user', 'Standard user / Student')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

INSERT INTO `users` (`id`, `email`, `password_hash`, `name`, `created_at`) VALUES
(1, 'admin@phishguard.local', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin User'),
(2, 'student@phishguard.local', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Alex Johnson')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Assign roles (1=admin, 2=user)
INSERT INTO `user_roles` (`user_id`, `role_id`) VALUES
(1, 1),
(2, 2)
ON DUPLICATE KEY UPDATE `role_id` = VALUES(`role_id`);

-- Levels
INSERT INTO `levels` (`id`, `level_number`, `min_points`, `title`) VALUES
(1, 1, 0, 'Rookie'),
(2, 2, 100, 'Guardian'),
(3, 3, 500, 'Sentinel'),
(4, 4, 1500, 'Expert'),
(5, 5, 5000, 'Master')
ON DUPLICATE KEY UPDATE `min_points` = VALUES(`min_points`), `title` = VALUES(`title`);

-- Initial points and streak for student
INSERT INTO `points_ledger` (`user_id`, `points`, `source`, `source_id`) VALUES
(2, 50, 'signup', NULL),
(2, 30, 'quiz', 1)
ON DUPLICATE KEY UPDATE `points` = VALUES(`points`);

INSERT INTO `user_streaks` (`user_id`, `streak_days`, `last_activity_date`) VALUES
(2, 3, CURDATE())
ON DUPLICATE KEY UPDATE `streak_days` = VALUES(`streak_days`), `last_activity_date` = VALUES(`last_activity_date`);

-- Badges
INSERT INTO `badges` (`id`, `name`, `description`, `icon`, `criteria`) VALUES
(1, 'First Steps', 'Complete your first lesson', 'book', 'first_lesson'),
(2, 'Quiz Master', 'Score 100% on a quiz', 'clipboard', 'quiz_perfect'),
(3, 'Vigilant', 'Complete 5 email scans', 'scan', 'scans_5')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`), `icon` = VALUES(`icon`);

INSERT INTO `user_badges` (`user_id`, `badge_id`) VALUES
(2, 1)
ON DUPLICATE KEY UPDATE `badge_id` = VALUES(`badge_id`);

-- Sample course and lessons
INSERT INTO `courses` (`id`, `title`, `description`, `order_index`) VALUES
(1, 'Phishing Fundamentals', 'Learn to recognize and report phishing attempts.', 1)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `description` = VALUES(`description`);

INSERT INTO `lessons` (`id`, `course_id`, `title`, `content`, `order_index`, `duration_minutes`) VALUES
(1, 1, 'What is Phishing?', 'Phishing is a type of social engineering attack where attackers impersonate trusted entities to steal credentials or install malware. This lesson covers the basics.', 1, 5),
(2, 1, 'Spotting Suspicious Emails', 'Learn to identify red flags: urgent language, mismatched URLs, sender address spoofing, and requests for sensitive data.', 2, 8),
(3, 1, 'Safe Reporting', 'How to report suspected phishing to your IT team and what information to include.', 3, 5)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `content` = VALUES(`content`), `order_index` = VALUES(`order_index`);

-- Sample quiz
INSERT INTO `quizzes` (`id`, `title`, `description`, `points_reward`) VALUES
(1, 'Phishing Basics Quiz', 'Test your knowledge of phishing awareness.', 20)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `points_reward` = VALUES(`points_reward`);

INSERT INTO `quiz_questions` (`id`, `quiz_id`, `question_text`, `order_index`) VALUES
(1, 1, 'Which of these is a common sign of a phishing email?', 1),
(2, 1, 'What should you do if you receive a suspicious email asking for your password?', 2)
ON DUPLICATE KEY UPDATE `question_text` = VALUES(`question_text`);

INSERT INTO `quiz_options` (`id`, `question_id`, `option_text`, `is_correct`, `order_index`) VALUES
(1, 1, 'Urgent request for personal information', 1, 1),
(2, 1, 'A clear, trusted sender address you recognize', 0, 2),
(3, 1, 'Official company letterhead only', 0, 3),
(4, 2, 'Reply with your password to verify', 0, 1),
(5, 2, 'Report it to IT and do not click links', 1, 2),
(6, 2, 'Forward it to colleagues to warn them', 0, 3)
ON DUPLICATE KEY UPDATE `option_text` = VALUES(`option_text`), `is_correct` = VALUES(`is_correct`);

-- Article category and sample article
INSERT INTO `article_categories` (`id`, `name`, `slug`) VALUES
(1, 'Email Security', 'email-security'),
(2, 'Best Practices', 'best-practices')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `slug` = VALUES(`slug`);

INSERT INTO `articles` (`id`, `category_id`, `title`, `slug`, `excerpt`, `content`) VALUES
(1, 1, 'How to Verify Email Sender Identity', 'verify-email-sender', 'Learn how to check if an email is really from who it says.', '<p>Always check the full email header and the actual reply-to address. Legitimate organizations use consistent domains.</p><p>Look for SPF/DKIM indicators in your client and never trust display names alone.</p>')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `content` = VALUES(`content`);

-- Sample simulation
INSERT INTO `simulations` (`id`, `title`, `description`, `scenario_type`, `max_score`) VALUES
(1, 'Suspicious Invoice', 'You receive an email that looks like an invoice from a vendor. Decide how to respond.', 'email', 100)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `description` = VALUES(`description`);

-- Sample notification and activity
INSERT INTO `notifications` (`user_id`, `title`, `body`, `type`, `link`) VALUES
(2, 'Welcome to PhishGuard', 'Complete your first training module to earn points.', 'welcome', '/dashboard/training')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

INSERT INTO `activity_log` (`user_id`, `action`, `entity_type`, `entity_id`, `meta`) VALUES
(2, 'lesson_complete', 'lesson', 1, '{"course_id":1}'),
(2, 'quiz_complete', 'quiz', 1, '{"score":100}')
ON DUPLICATE KEY UPDATE `action` = VALUES(`action`);
