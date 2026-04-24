import XCTest
@testable import FretboardTrainer

final class StatsStoreTests: XCTestCase {
    func testStatsPersistInInjectedDefaultsSuite() {
        let suiteName = "FretboardTrainerTests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defaults.removePersistentDomain(forName: suiteName)

        let store = StatsStore(userDefaults: defaults)
        _ = store.recordAttempt(wasCorrect: true, solvedOnFirstTry: true, streak: 3)
        _ = store.recordAttempt(wasCorrect: false, solvedOnFirstTry: false, streak: 0)

        XCTAssertEqual(
            store.load(),
            LifetimeStats(
                totalAnswers: 2,
                correctAnswers: 1,
                bestStreak: 3,
                solvedPrompts: 1,
                firstTryCorrectAnswers: 1,
                incorrectGuesses: 1
            )
        )
    }

    func testLegacyStatsDecodeWithDerivedNewCounters() {
        let suiteName = "FretboardTrainerTests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defaults.removePersistentDomain(forName: suiteName)
        defaults.set(
            #"{"totalAnswers":5,"correctAnswers":3,"bestStreak":2}"#.data(using: .utf8),
            forKey: "lifetime_stats"
        )

        let store = StatsStore(userDefaults: defaults)

        XCTAssertEqual(
            store.load(),
            LifetimeStats(
                totalAnswers: 5,
                correctAnswers: 3,
                bestStreak: 2,
                solvedPrompts: 3,
                firstTryCorrectAnswers: 3,
                incorrectGuesses: 2
            )
        )
    }
}
