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
        isCorrect ? "\(selectedAnswer.rawValue) is correct." : "Try again."
    }
}

@MainActor
@Observable
final class PracticeSession {
    private var engine: QuizEngine
    private let statsStore: StatsStore
    private var scriptedPromptIndex: Int?
    private var currentPromptIncorrectGuesses = 0

    private(set) var currentPrompt: QuizPrompt
    private(set) var feedback: AnswerFeedback?
    private(set) var sessionSolvedPrompts = 0
    private(set) var sessionAttempts = 0
    private(set) var sessionIncorrectGuesses = 0
    private(set) var firstTryCorrectAnswers = 0
    private(set) var currentStreak = 0
    private(set) var lifetimeStats: LifetimeStats
    private(set) var notePracticeMode: NotePracticeMode
    private(set) var fretRange: FretRange
    private(set) var recentMisses: [RecentMiss]

    init(
        engine: QuizEngine = QuizEngine(),
        statsStore: StatsStore = StatsStore(),
        initialPromptIndex: Int? = nil
    ) {
        self.statsStore = statsStore
        let storedMode = statsStore.loadNotePracticeMode()
        let storedFretRange = statsStore.loadFretRange()
        let resolvedEngine = QuizEngine(fretRange: storedFretRange, notePracticeMode: storedMode)
        self.engine = resolvedEngine
        self.notePracticeMode = storedMode
        self.fretRange = storedFretRange
        self.scriptedPromptIndex = initialPromptIndex.map { ($0 + 1) % resolvedEngine.availablePositions.count }
        lifetimeStats = statsStore.load()
        recentMisses = statsStore.loadRecentMisses()

        if let initialPromptIndex {
            currentPrompt = resolvedEngine.prompt(at: initialPromptIndex)
        } else {
            currentPrompt = resolvedEngine.makeRandomPrompt()
        }
    }

    var answerChoices: [NoteName] {
        notePracticeMode.answerChoices
    }

    var promptDescription: String {
        "\(currentPrompt.position.string.label) string, fret \(currentPrompt.position.fret)"
    }

    func submit(answer: NoteName) {
        guard feedback?.isCorrect != true else {
            return
        }

        let isCorrect = engine.evaluate(answer, for: currentPrompt)
        sessionAttempts += 1

        if isCorrect {
            sessionSolvedPrompts += 1
            currentStreak += 1

            if currentPromptIncorrectGuesses == 0 {
                firstTryCorrectAnswers += 1
            }
        } else {
            currentPromptIncorrectGuesses += 1
            sessionIncorrectGuesses += 1
            currentStreak = 0
            recentMisses = statsStore.recordMiss(
                position: currentPrompt.position,
                correctAnswer: currentPrompt.correctAnswer,
                selectedAnswer: answer
            )
        }

        lifetimeStats = statsStore.recordAttempt(
            wasCorrect: isCorrect,
            solvedOnFirstTry: isCorrect && currentPromptIncorrectGuesses == 0,
            streak: currentStreak
        )
        feedback = AnswerFeedback(
            selectedAnswer: answer,
            correctAnswer: currentPrompt.correctAnswer,
            isCorrect: isCorrect
        )
    }

    func setNotePracticeMode(_ mode: NotePracticeMode) {
        guard mode != notePracticeMode else {
            return
        }

        notePracticeMode = mode
        statsStore.saveNotePracticeMode(mode)
        rebuildEngine()
    }

    func setFretRange(start: Int, end: Int) {
        let newRange = FretRange(start: start, end: end)
        guard newRange != fretRange else {
            return
        }

        fretRange = newRange
        statsStore.saveFretRange(newRange)
        rebuildEngine()
    }

    func nextPrompt() {
        feedback = nil
        currentPromptIncorrectGuesses = 0

        if let scriptedPromptIndex {
            currentPrompt = engine.prompt(at: scriptedPromptIndex)
            self.scriptedPromptIndex = (scriptedPromptIndex + 1) % engine.availablePositions.count
            return
        }

        currentPrompt = engine.makeNextPrompt(excluding: currentPrompt)
    }

    private func rebuildEngine() {
        engine = QuizEngine(fretRange: fretRange, notePracticeMode: notePracticeMode)
        scriptedPromptIndex = scriptedPromptIndex.map { $0 % engine.availablePositions.count }
        feedback = nil
        currentPromptIncorrectGuesses = 0
        currentPrompt = engine.makeRandomPrompt()
    }
}
