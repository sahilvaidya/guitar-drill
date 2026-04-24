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

final class StatsStore {
    private let userDefaults: UserDefaults
    private let statsKey = "lifetime_stats"
    private let notePracticeModeKey = "note_practice_mode"

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
