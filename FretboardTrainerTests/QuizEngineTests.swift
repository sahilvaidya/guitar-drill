import XCTest
@testable import FretboardTrainer

final class QuizEngineTests: XCTestCase {
    func testPromptAtIndexBuildsExpectedAnswer() {
        let engine = QuizEngine()
        let prompt = engine.prompt(at: 0)

        XCTAssertEqual(prompt.position, FretPosition(string: .lowE, fret: 0))
        XCTAssertEqual(prompt.correctAnswer, .E)
    }

    func testAvailablePromptsAreNaturalNotesOnly() {
        let engine = QuizEngine()

        XCTAssertFalse(engine.availablePositions.isEmpty)
        XCTAssertTrue(engine.availablePositions.allSatisfy { $0.noteName != nil })
    }

    func testAnswerEvaluationMatchesCorrectAnswer() {
        let engine = QuizEngine()
        let prompt = engine.prompt(at: 0)

        XCTAssertTrue(engine.evaluate(.E, for: prompt))
        XCTAssertFalse(engine.evaluate(.F, for: prompt))
    }
}
