import Foundation
import Observation

struct AnswerFeedback: Equatable {
    let selectedAnswer: NoteName
    let correctAnswer: NoteName
    let isCorrect: Bool

    var title: String {
        isCorrect ? "Correct" : "Incorrect"
    }

    var message: String {
        isCorrect ? "\(selectedAnswer.rawValue) is correct." : "The correct note is \(correctAnswer.rawValue)."
    }
}

@MainActor
@Observable
final class PracticeSession {
    let answerChoices = NoteName.allCases

    private let engine: QuizEngine
    private let statsStore: StatsStore
    private var scriptedPromptIndex: Int?

    private(set) var currentPrompt: QuizPrompt
    private(set) var feedback: AnswerFeedback?
    private(set) var sessionCorrect = 0
    private(set) var sessionAttempts = 0
    private(set) var currentStreak = 0
    private(set) var lifetimeStats: LifetimeStats

    init(
        engine: QuizEngine = QuizEngine(),
        statsStore: StatsStore = StatsStore(),
        initialPromptIndex: Int? = nil
    ) {
        self.engine = engine
        self.statsStore = statsStore
        self.scriptedPromptIndex = initialPromptIndex.map { ($0 + 1) % engine.availablePositions.count }
        lifetimeStats = statsStore.load()

        if let initialPromptIndex {
            currentPrompt = engine.prompt(at: initialPromptIndex)
        } else {
            currentPrompt = engine.makeRandomPrompt()
        }
    }

    var promptDescription: String {
        "\(currentPrompt.position.string.label) string, fret \(currentPrompt.position.fret)"
    }

    func submit(answer: NoteName) {
        guard feedback == nil else {
            return
        }

        let isCorrect = engine.evaluate(answer, for: currentPrompt)
        sessionAttempts += 1

        if isCorrect {
            sessionCorrect += 1
            currentStreak += 1
        } else {
            currentStreak = 0
        }

        lifetimeStats = statsStore.record(answerWasCorrect: isCorrect, streak: currentStreak)
        feedback = AnswerFeedback(
            selectedAnswer: answer,
            correctAnswer: currentPrompt.correctAnswer,
            isCorrect: isCorrect
        )
    }

    func nextPrompt() {
        feedback = nil

        if let scriptedPromptIndex {
            currentPrompt = engine.prompt(at: scriptedPromptIndex)
            self.scriptedPromptIndex = (scriptedPromptIndex + 1) % engine.availablePositions.count
            return
        }

        currentPrompt = engine.makeNextPrompt(excluding: currentPrompt)
    }
}
