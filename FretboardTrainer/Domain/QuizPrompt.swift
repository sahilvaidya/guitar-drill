import Foundation

struct QuizPrompt: Identifiable, Equatable {
    let position: FretPosition
    let correctAnswer: NoteName

    var id: String {
        position.id
    }
}
