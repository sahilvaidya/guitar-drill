import SwiftUI

struct FretboardView: View {
    let prompt: QuizPrompt

    private let strings = GuitarString.allCases
    private let frets = Array(0...12)

    var body: some View {
        GeometryReader { geometry in
            let leftInset: CGFloat = 52
            let rightInset: CGFloat = 18
            let topInset: CGFloat = 28
            let bottomInset: CGFloat = 24
            let usableWidth = geometry.size.width - leftInset - rightInset
            let usableHeight = geometry.size.height - topInset - bottomInset
            let fretSpacing = usableWidth / CGFloat(frets.count + 1)
            let stringSpacing = usableHeight / CGFloat(strings.count - 1)

            ZStack {
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .fill(.background)

                ForEach(strings) { string in
                    let y = topInset + CGFloat(string.rawValue) * stringSpacing

                    Path { path in
                        path.move(to: CGPoint(x: leftInset, y: y))
                        path.addLine(to: CGPoint(x: geometry.size.width - rightInset, y: y))
                    }
                    .stroke(Color.secondary.opacity(0.35), lineWidth: 2)

                    Text(string.label)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .position(x: 24, y: y)
                }

                ForEach(0...(frets.count + 1), id: \.self) { lineIndex in
                    let x = leftInset + CGFloat(lineIndex) * fretSpacing

                    Path { path in
                        path.move(to: CGPoint(x: x, y: topInset - 4))
                        path.addLine(to: CGPoint(x: x, y: geometry.size.height - bottomInset + 4))
                    }
                    .stroke(lineIndex == 0 ? Color.primary.opacity(0.55) : Color.secondary.opacity(0.18), lineWidth: lineIndex == 0 ? 4 : 1)
                }

                ForEach(frets, id: \.self) { fret in
                    let x = leftInset + (CGFloat(fret) + 0.5) * fretSpacing

                    Text("\(fret)")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .position(x: x, y: 12)
                }

                Circle()
                    .fill(Color.accentColor)
                    .frame(width: 24, height: 24)
                    .overlay(
                        Circle()
                            .stroke(.white.opacity(0.9), lineWidth: 2)
                    )
                    .position(
                        x: leftInset + (CGFloat(prompt.position.fret) + 0.5) * fretSpacing,
                        y: topInset + CGFloat(prompt.position.string.rawValue) * stringSpacing
                    )
                    .accessibilityIdentifier("prompt_dot")
            }
        }
    }
}
