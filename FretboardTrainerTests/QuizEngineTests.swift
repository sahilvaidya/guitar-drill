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

    func testChromaticModeIncludesAccidentalPositions() {
        let engine = QuizEngine(notePracticeMode: .chromatic)

        XCTAssertEqual(engine.availablePositions.count, GuitarString.allCases.count * 13)
        XCTAssertTrue(engine.availablePositions.contains(FretPosition(string: .lowE, fret: 2)))
        XCTAssertEqual(engine.prompt(at: 2).correctAnswer, .FSharpGFlat)
    }

    func testAnswerEvaluationMatchesCorrectAnswer() {
        let engine = QuizEngine()
        let prompt = engine.prompt(at: 0)

        XCTAssertTrue(engine.evaluate(.E, for: prompt))
        XCTAssertFalse(engine.evaluate(.F, for: prompt))
    }

    func testChromaticAnswerEvaluationMatchesAccidentalAnswer() {
        let engine = QuizEngine(notePracticeMode: .chromatic)
        let prompt = engine.prompt(at: 2)

        XCTAssertTrue(engine.evaluate(.FSharpGFlat, for: prompt))
        XCTAssertFalse(engine.evaluate(.G, for: prompt))
    }
}
