import Observation
import SwiftUI

struct ContentView: View {
    @Bindable var session: PracticeSession

    private let columns = [
        GridItem(.flexible()),
        GridItem(.flexible()),
        GridItem(.flexible()),
        GridItem(.flexible()),
    ]

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

                if session.feedback != nil {
                    Button("Next Note") {
                        session.nextPrompt()
                    }
                    .buttonStyle(PrimaryActionButtonStyle())
                    .accessibilityIdentifier("next_note")
                }

                lifetimeStats
            }
            .padding(20)
        }
        .background(Color(uiColor: .systemGroupedBackground))
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Fretboard Trainer")
                .font(.largeTitle.bold())

            HStack(spacing: 12) {
                statChip(title: "Session", value: "\(session.sessionCorrect)/\(max(session.sessionAttempts, 1))")
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
        LazyVGrid(columns: columns, spacing: 12) {
            ForEach(session.answerChoices) { note in
                Button(note.rawValue) {
                    session.submit(answer: note)
                }
                .buttonStyle(AnswerChoiceButtonStyle(state: buttonState(for: note)))
                .disabled(session.feedback != nil)
                .accessibilityIdentifier("answer_\(note.rawValue)")
            }
        }
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
                statChip(title: "Correct", value: "\(session.lifetimeStats.correctAnswers)")
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

        if note == feedback.correctAnswer {
            return .correct
        }

        if note == feedback.selectedAnswer {
            return .incorrect
        }

        return .disabled
    }
}

private struct PrimaryActionButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(configuration.isPressed ? Color.accentColor.opacity(0.8) : Color.accentColor)
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
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
