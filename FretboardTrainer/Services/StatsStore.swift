import Foundation

struct LifetimeStats: Codable, Equatable {
    var totalAnswers: Int
    var correctAnswers: Int
    var bestStreak: Int
    var solvedPrompts: Int
    var firstTryCorrectAnswers: Int
    var incorrectGuesses: Int

    static let empty = LifetimeStats(
        totalAnswers: 0,
        correctAnswers: 0,
        bestStreak: 0,
        solvedPrompts: 0,
        firstTryCorrectAnswers: 0,
        incorrectGuesses: 0
    )

    init(
        totalAnswers: Int,
        correctAnswers: Int,
        bestStreak: Int,
        solvedPrompts: Int,
        firstTryCorrectAnswers: Int,
        incorrectGuesses: Int
    ) {
        self.totalAnswers = totalAnswers
        self.correctAnswers = correctAnswers
        self.bestStreak = bestStreak
        self.solvedPrompts = solvedPrompts
        self.firstTryCorrectAnswers = firstTryCorrectAnswers
        self.incorrectGuesses = incorrectGuesses
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        totalAnswers = try container.decode(Int.self, forKey: .totalAnswers)
        correctAnswers = try container.decode(Int.self, forKey: .correctAnswers)
        bestStreak = try container.decode(Int.self, forKey: .bestStreak)
        solvedPrompts = try container.decodeIfPresent(Int.self, forKey: .solvedPrompts) ?? correctAnswers
        firstTryCorrectAnswers = try container.decodeIfPresent(Int.self, forKey: .firstTryCorrectAnswers) ?? correctAnswers
        incorrectGuesses = try container.decodeIfPresent(Int.self, forKey: .incorrectGuesses) ?? max(totalAnswers - correctAnswers, 0)
    }
}

struct RecentMiss: Codable, Equatable, Identifiable {
    let position: FretPosition
    let correctAnswer: NoteName
    let selectedAnswer: NoteName

    var id: String {
        "\(position.id)-\(selectedAnswer.rawValue)"
    }

    var label: String {
        "\(position.string.label) string, fret \(position.fret): \(selectedAnswer.rawValue) -> \(correctAnswer.rawValue)"
    }
}

struct PromptTimingStats: Codable, Equatable {
    var recentCorrectAnswerDurations: [TimeInterval]

    static let empty = PromptTimingStats(recentCorrectAnswerDurations: [])
    static let maxRecentDurations = 5

    init(recentCorrectAnswerDurations: [TimeInterval]) {
        self.recentCorrectAnswerDurations = Array(
            recentCorrectAnswerDurations
                .map { max($0, 0) }
                .prefix(Self.maxRecentDurations)
        )
    }

    var lastCorrectAnswerDuration: TimeInterval? {
        recentCorrectAnswerDurations.first
    }

    var averageRecentCorrectAnswerDuration: TimeInterval? {
        guard !recentCorrectAnswerDurations.isEmpty else {
            return nil
        }

        return recentCorrectAnswerDurations.reduce(0, +) / Double(recentCorrectAnswerDurations.count)
    }

    mutating func recordCorrectAnswerDuration(_ duration: TimeInterval) {
        recentCorrectAnswerDurations = Array(([max(duration, 0)] + recentCorrectAnswerDurations).prefix(Self.maxRecentDurations))
    }
}

final class StatsStore {
    private let userDefaults: UserDefaults
    private let statsKey = "lifetime_stats"
    private let notePracticeModeKey = "note_practice_mode"
    private let fretRangeKey = "fret_range"
    private let recentMissesKey = "recent_misses"
    private let promptTimingStatsKey = "prompt_timing_stats"
    private let maxRecentMisses = 5

    init(userDefaults: UserDefaults = .standard) {
        self.userDefaults = userDefaults
    }

    func load() -> LifetimeStats {
        guard let data = userDefaults.data(forKey: statsKey),
              let stats = try? JSONDecoder().decode(LifetimeStats.self, from: data) else {
            return .empty
        }

        return stats
    }

    func save(_ stats: LifetimeStats) {
        guard let data = try? JSONEncoder().encode(stats) else {
            return
        }

        userDefaults.set(data, forKey: statsKey)
    }

    func loadNotePracticeMode() -> NotePracticeMode {
        guard let rawValue = userDefaults.string(forKey: notePracticeModeKey),
              let mode = NotePracticeMode(rawValue: rawValue) else {
            return .natural
        }

        return mode
    }

    func saveNotePracticeMode(_ mode: NotePracticeMode) {
        userDefaults.set(mode.rawValue, forKey: notePracticeModeKey)
    }

    func loadFretRange() -> FretRange {
        guard let data = userDefaults.data(forKey: fretRangeKey),
              let fretRange = try? JSONDecoder().decode(FretRange.self, from: data) else {
            return .full
        }

        return fretRange
    }

    func saveFretRange(_ fretRange: FretRange) {
        guard let data = try? JSONEncoder().encode(fretRange) else {
            return
        }

        userDefaults.set(data, forKey: fretRangeKey)
    }

    func loadRecentMisses() -> [RecentMiss] {
        guard let data = userDefaults.data(forKey: recentMissesKey),
              let recentMisses = try? JSONDecoder().decode([RecentMiss].self, from: data) else {
            return []
        }

        return recentMisses
    }

    func loadPromptTimingStats() -> PromptTimingStats {
        guard let data = userDefaults.data(forKey: promptTimingStatsKey),
              let timingStats = try? JSONDecoder().decode(PromptTimingStats.self, from: data) else {
            return .empty
        }

        return timingStats
    }

    func savePromptTimingStats(_ timingStats: PromptTimingStats) {
        guard let data = try? JSONEncoder().encode(timingStats) else {
            return
        }

        userDefaults.set(data, forKey: promptTimingStatsKey)
    }

    func recordMiss(position: FretPosition, correctAnswer: NoteName, selectedAnswer: NoteName) -> [RecentMiss] {
        let miss = RecentMiss(
            position: position,
            correctAnswer: correctAnswer,
            selectedAnswer: selectedAnswer
        )
        let recentMisses = Array(([miss] + loadRecentMisses()).prefix(maxRecentMisses))
        saveRecentMisses(recentMisses)
        return recentMisses
    }

    @discardableResult
    func recordCorrectAnswerDuration(_ duration: TimeInterval) -> PromptTimingStats {
        var timingStats = loadPromptTimingStats()
        timingStats.recordCorrectAnswerDuration(duration)
        savePromptTimingStats(timingStats)
        return timingStats
    }

    private func saveRecentMisses(_ recentMisses: [RecentMiss]) {
        guard let data = try? JSONEncoder().encode(recentMisses) else {
            return
        }

        userDefaults.set(data, forKey: recentMissesKey)
    }

    @discardableResult
    func recordAttempt(wasCorrect: Bool, solvedOnFirstTry: Bool, streak: Int) -> LifetimeStats {
        var stats = load()
        stats.totalAnswers += 1

        if wasCorrect {
            stats.correctAnswers += 1
            stats.solvedPrompts += 1

            if solvedOnFirstTry {
                stats.firstTryCorrectAnswers += 1
            }
        } else {
            stats.incorrectGuesses += 1
        }

        stats.bestStreak = max(stats.bestStreak, streak)
        save(stats)
        return stats
    }

    static func inMemory(suiteName: String = "FretboardTrainer.\(UUID().uuidString)") -> StatsStore {
        let defaults = UserDefaults(suiteName: suiteName) ?? .standard
        defaults.removePersistentDomain(forName: suiteName)
        return StatsStore(userDefaults: defaults)
    }
}
