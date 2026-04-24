import Foundation

struct LifetimeStats: Codable, Equatable {
    var totalAnswers: Int
    var correctAnswers: Int
    var bestStreak: Int

    static let empty = LifetimeStats(totalAnswers: 0, correctAnswers: 0, bestStreak: 0)
}

final class StatsStore {
    private let userDefaults: UserDefaults
    private let statsKey = "lifetime_stats"

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

    @discardableResult
    func record(answerWasCorrect: Bool, streak: Int) -> LifetimeStats {
        var stats = load()
        stats.totalAnswers += 1

        if answerWasCorrect {
            stats.correctAnswers += 1
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
