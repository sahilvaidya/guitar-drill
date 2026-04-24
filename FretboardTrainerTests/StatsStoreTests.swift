import XCTest
@testable import FretboardTrainer

final class StatsStoreTests: XCTestCase {
    func testStatsPersistInInjectedDefaultsSuite() {
        let suiteName = "FretboardTrainerTests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defaults.removePersistentDomain(forName: suiteName)

        let store = StatsStore(userDefaults: defaults)
        _ = store.record(answerWasCorrect: true, streak: 3)
        _ = store.record(answerWasCorrect: false, streak: 0)

        XCTAssertEqual(store.load(), LifetimeStats(totalAnswers: 2, correctAnswers: 1, bestStreak: 3))
    }
}
