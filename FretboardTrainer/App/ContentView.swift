import Observation
import SwiftUI

struct ContentView: View {
    @Bindable var session: PracticeSession

    private let answerColumnCount = 4

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                header
                promptCard
                FretboardView(prompt: session.currentPrompt)
                    .frame(height: 260)
                    .padding(.vertical, 4)

                if let feedback = session.feedback {
                    feedbackCard(feedback)
                }

                answerGrid

                lifetimeStats
            }
            .padding(20)
        }
        .background(Color(uiColor: .systemGroupedBackground))
        .task(id: session.feedback) {
            guard session.feedback?.isCorrect == true else {
                return
            }

            try? await Task.sleep(for: .seconds(1.5))

            if !Task.isCancelled {
                session.nextPrompt()
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Fretboard Trainer")
                .font(.largeTitle.bold())

            HStack(spacing: 12) {
                statChip(title: "Solved", value: "\(session.sessionSolvedPrompts)")
                statChip(title: "Guesses", value: "\(session.sessionAttempts)")
                statChip(title: "Streak", value: "\(session.currentStreak)")
            }
        }
    }

    private var promptCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Find the note on the highlighted position.")
                .font(.headline)
            Text(session.promptDescription)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .accessibilityIdentifier("prompt_description")
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(.background)
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
    }

    private var answerGrid: some View {
        VStack(spacing: 12) {
            ForEach(answerRows.indices, id: \.self) { rowIndex in
                HStack(spacing: 12) {
                    ForEach(answerRows[rowIndex]) { note in
                        answerButton(for: note)
                    }

                    ForEach(0..<emptySlots(in: answerRows[rowIndex]), id: \.self) { _ in
                        Spacer()
                            .frame(maxWidth: .infinity)
                    }
                }
            }
        }
    }

    private var answerRows: [[NoteName]] {
        session.answerChoices.chunked(into: answerColumnCount)
    }

    private func emptySlots(in row: [NoteName]) -> Int {
        answerColumnCount - row.count
    }

    private func answerButton(for note: NoteName) -> some View {
        Button(note.rawValue) {
            session.submit(answer: note)
        }
        .buttonStyle(AnswerChoiceButtonStyle(state: buttonState(for: note)))
        .disabled(session.feedback?.isCorrect == true)
        .accessibilityIdentifier("answer_\(note.accessibilityIDComponent)")
    }

    private func feedbackCard(_ feedback: AnswerFeedback) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(feedback.title)
                .font(.headline)
            Text(feedback.message)
                .font(.subheadline)
        }
        .foregroundStyle(feedback.isCorrect ? Color.green : Color.red)
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(.background)
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("feedback_label")
    }

    private var lifetimeStats: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Lifetime Stats")
                .font(.headline)

            HStack(spacing: 12) {
                statChip(title: "Answered", value: "\(session.lifetimeStats.totalAnswers)")
                statChip(title: "Solved", value: "\(session.lifetimeStats.solvedPrompts)")
                statChip(title: "Best Streak", value: "\(session.lifetimeStats.bestStreak)")
            }
        }
    }

    private func statChip(title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.title3.bold())
                .monospacedDigit()
        }
        .padding(.vertical, 10)
        .padding(.horizontal, 12)
        .background(.background)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private func buttonState(for note: NoteName) -> AnswerChoiceButtonStyle.State {
        guard let feedback = session.feedback else {
            return .idle
        }

        if feedback.isCorrect {
            return note == feedback.correctAnswer ? .correct : .disabled
        }

        return note == feedback.selectedAnswer ? .incorrect : .idle
    }
}

private struct AnswerChoiceButtonStyle: ButtonStyle {
    enum State {
        case idle
        case correct
        case incorrect
        case disabled
    }

    let state: State

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.title3.weight(.semibold))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(backgroundColor(isPressed: configuration.isPressed))
            .foregroundStyle(foregroundColor)
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .stroke(borderColor, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }

    private func backgroundColor(isPressed: Bool) -> Color {
        switch state {
        case .idle:
            return isPressed ? Color.accentColor.opacity(0.15) : Color(uiColor: .systemBackground)
        case .correct:
            return Color.green.opacity(0.18)
        case .incorrect:
            return Color.red.opacity(0.18)
        case .disabled:
            return Color.gray.opacity(0.12)
        }
    }

    private var foregroundColor: Color {
        switch state {
        case .incorrect:
            return .red
        case .correct:
            return .green
        case .disabled:
            return .secondary
        case .idle:
            return .primary
        }
    }

    private var borderColor: Color {
        switch state {
        case .correct:
            return .green
        case .incorrect:
            return .red
        case .disabled:
            return Color.gray.opacity(0.25)
        case .idle:
            return Color.gray.opacity(0.2)
        }
    }
}

private extension Array {
    func chunked(into size: Int) -> [[Element]] {
        stride(from: 0, to: count, by: size).map {
            Array(self[$0..<Swift.min($0 + size, count)])
        }
    }
}
