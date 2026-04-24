import Foundation

struct QuizEngine {
    let fretRange: ClosedRange<Int>
    let availablePositions: [FretPosition]

    init(fretRange: ClosedRange<Int> = 0...12, strings: [GuitarString] = GuitarString.allCases) {
        self.fretRange = fretRange
        availablePositions = strings.flatMap { string in
            fretRange.compactMap { fret in
                let position = FretPosition(string: string, fret: fret)
                return position.noteName == nil ? nil : position
            }
        }

        precondition(!availablePositions.isEmpty, "QuizEngine requires at least one natural-note fret position.")
    }

    func prompt(at index: Int) -> QuizPrompt {
        let normalizedIndex = availablePositions.index(availablePositions.startIndex, offsetBy: index % availablePositions.count)
        let position = availablePositions[normalizedIndex]
        return QuizPrompt(position: position, correctAnswer: position.noteName!)
    }

    func makeRandomPrompt() -> QuizPrompt {
        prompt(at: Int.random(in: 0..<availablePositions.count))
    }

    func makeNextPrompt(excluding current: QuizPrompt?) -> QuizPrompt {
        guard availablePositions.count > 1, let current else {
            return makeRandomPrompt()
        }

        let nextPool = availablePositions.filter { $0 != current.position }
        let position = nextPool.randomElement() ?? availablePositions[0]
        return QuizPrompt(position: position, correctAnswer: position.noteName!)
    }

    func evaluate(_ answer: NoteName, for prompt: QuizPrompt) -> Bool {
        answer == prompt.correctAnswer
    }
}
