import XCTest
@testable import FretboardTrainer

final class PracticeSessionTests: XCTestCase {
    func testCorrectAnswerTimingPersistsAndResetsWithNextPrompt() {
        let suiteName = "FretboardTrainerTests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defaults.removePersistentDomain(forName: suiteName)

        let store = StatsStore(userDefaults: defaults)
        var currentTime = Date(timeIntervalSince1970: 1_000)

        let session = PracticeSession(
            statsStore: store,
            initialPromptIndex: 0,
            now: { currentTime }
        )

        currentTime = currentTime.addingTimeInterval(2)
        session.submit(answer: .F)
        XCTAssertNil(session.lastCorrectAnswerDuration)

        currentTime = currentTime.addingTimeInterval(1.5)
        session.submit(answer: .E)

        XCTAssertEqual(session.lastCorrectAnswerDuration, 3.5, accuracy: 0.0001)
        XCTAssertEqual(session.promptTimingStats.lastCorrectAnswerDuration, 3.5, accuracy: 0.0001)
        XCTAssertEqual(store.loadPromptTimingStats().lastCorrectAnswerDuration, 3.5, accuracy: 0.0001)

        guard let firstAverage = store.loadPromptTimingStats().averageRecentCorrectAnswerDuration else {
            return XCTFail("Expected a persisted average timing value")
        }
        XCTAssertEqual(firstAverage, 3.5, accuracy: 0.0001)

        session.nextPrompt()
        XCTAssertNil(session.lastCorrectAnswerDuration)

        currentTime = currentTime.addingTimeInterval(4)
        session.submit(answer: session.currentPrompt.correctAnswer)

        XCTAssertEqual(session.lastCorrectAnswerDuration, 4.0, accuracy: 0.0001)
        guard let sessionAverage = session.promptTimingStats.averageRecentCorrectAnswerDuration else {
            return XCTFail("Expected a session average timing value")
        }
        guard let storedAverage = store.loadPromptTimingStats().averageRecentCorrectAnswerDuration else {
            return XCTFail("Expected a persisted average timing value")
        }
        XCTAssertEqual(sessionAverage, 3.75, accuracy: 0.0001)
        XCTAssertEqual(storedAverage, 3.75, accuracy: 0.0001)
    }
}
