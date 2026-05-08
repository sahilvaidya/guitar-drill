import SwiftUI

struct FretboardView: View {
    let prompt: QuizPrompt

    private let strings = GuitarString.allCases
    private let frets = Array(1...12)

    var body: some View {
        GeometryReader { geometry in
            let layout = FretboardLayout(size: geometry.size, stringCount: strings.count)

            ZStack {
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .fill(.background)

                ForEach(strings) { string in
                    let y = layout.yPosition(for: string)

                    Path { path in
                        path.move(to: CGPoint(x: layout.leftInset, y: y))
                        path.addLine(to: CGPoint(x: layout.rightEdge, y: y))
                    }
                    .stroke(Color.secondary.opacity(0.35), lineWidth: 2)

                    Text(string.label)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .position(x: 24, y: y)
                }

                ForEach(0...frets.count, id: \.self) { lineIndex in
                    let x = layout.leftInset + CGFloat(lineIndex) * layout.fretSpacing

                    Path { path in
                        path.move(to: CGPoint(x: x, y: layout.topInset - 4))
                        path.addLine(to: CGPoint(x: x, y: layout.bottomEdge + 4))
                    }
                    .stroke(lineIndex == 0 ? Color.primary.opacity(0.55) : Color.secondary.opacity(0.18), lineWidth: lineIndex == 0 ? 4 : 1)
                }

                ForEach(frets, id: \.self) { fret in
                    Text("\(fret)")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .position(x: layout.xPosition(forFret: fret), y: 12)
                }

                Circle()
                    .fill(Color.accentColor)
                    .frame(width: 24, height: 24)
                    .overlay(
                        Circle()
                            .stroke(.white.opacity(0.9), lineWidth: 2)
                    )
                    .position(
                        x: layout.xPosition(forFret: prompt.position.fret),
                        y: layout.yPosition(for: prompt.position.string)
                    )
                    .accessibilityIdentifier("prompt_dot")
            }
        }
    }
}

struct FretboardLayout {
    let size: CGSize
    let stringCount: Int

    let leftInset: CGFloat = 52
    let rightInset: CGFloat = 18
    let topInset: CGFloat = 28
    let bottomInset: CGFloat = 24

    var rightEdge: CGFloat {
        size.width - rightInset
    }

    var bottomEdge: CGFloat {
        size.height - bottomInset
    }

    var fretSpacing: CGFloat {
        (size.width - leftInset - rightInset) / 12
    }

    private var stringSpacing: CGFloat {
        (size.height - topInset - bottomInset) / CGFloat(stringCount - 1)
    }

    func xPosition(forFret fret: Int) -> CGFloat {
        guard fret > 0 else {
            return leftInset
        }

        return leftInset + (CGFloat(fret) - 0.5) * fretSpacing
    }

    func yPosition(for string: GuitarString) -> CGFloat {
        topInset + CGFloat(string.rawValue) * stringSpacing
    }
}
