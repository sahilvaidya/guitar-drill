import Foundation

struct FretRange: Codable, Equatable {
    static let full = FretRange(start: 0, end: 12)

    let start: Int
    let end: Int

    init(start: Int, end: Int) {
        let lowerBound = min(max(start, 0), 12)
        let upperBound = min(max(end, 0), 12)
        self.start = min(lowerBound, upperBound)
        self.end = max(lowerBound, upperBound)
    }

    var closedRange: ClosedRange<Int> {
        start...end
    }

    var label: String {
        start == end ? "Fret \(start)" : "Frets \(start)-\(end)"
    }
}

struct FretPosition: Hashable, Codable, Identifiable {
    let string: GuitarString
    let fret: Int

    init(string: GuitarString, fret: Int) {
        precondition(fret >= 0, "Fret values must be non-negative.")
        self.string = string
        self.fret = fret
    }

    var id: String {
        "\(string.rawValue)-\(fret)"
    }

    var pitchClass: Int {
        (string.openPitchClass + fret) % 12
    }

    var chromaticNoteName: NoteName {
        NoteName(pitchClass: pitchClass)!
    }

    var naturalNoteName: NoteName? {
        let note = chromaticNoteName
        return note.isNatural ? note : nil
    }

    var noteName: NoteName? {
        naturalNoteName
    }

    func noteName(for mode: NotePracticeMode) -> NoteName? {
        switch mode {
        case .natural:
            return naturalNoteName
        case .chromatic:
            return chromaticNoteName
        }
    }
}

enum NotePracticeMode: String, CaseIterable, Codable, Identifiable {
    case natural
    case chromatic

    var id: String { rawValue }

    var label: String {
        switch self {
        case .natural:
            return "Natural"
        case .chromatic:
            return "Chromatic"
        }
    }

    var answerChoices: [NoteName] {
        switch self {
        case .natural:
            return NoteName.naturalCases
        case .chromatic:
            return NoteName.chromaticCases
        }
    }

    var includesAllFrets: Bool {
        self == .chromatic
    }
}
