import Foundation

enum NoteName: String, CaseIterable, Codable, Identifiable {
    case A
    case ASharpBFlat = "A#/Bb"
    case B
    case C
    case CSharpDFlat = "C#/Db"
    case D
    case DSharpEFlat = "D#/Eb"
    case E
    case F
    case FSharpGFlat = "F#/Gb"
    case G
    case GSharpAFlat = "G#/Ab"

    var id: String { rawValue }

    static let naturalCases: [NoteName] = [.A, .B, .C, .D, .E, .F, .G]

    static let chromaticCases: [NoteName] = [
        .A,
        .ASharpBFlat,
        .B,
        .C,
        .CSharpDFlat,
        .D,
        .DSharpEFlat,
        .E,
        .F,
        .FSharpGFlat,
        .G,
        .GSharpAFlat,
    ]

    init?(pitchClass: Int) {
        switch (pitchClass % 12 + 12) % 12 {
        case 0:
            self = .C
        case 1:
            self = .CSharpDFlat
        case 2:
            self = .D
        case 3:
            self = .DSharpEFlat
        case 4:
            self = .E
        case 5:
            self = .F
        case 6:
            self = .FSharpGFlat
        case 7:
            self = .G
        case 8:
            self = .GSharpAFlat
        case 9:
            self = .A
        case 10:
            self = .ASharpBFlat
        case 11:
            self = .B
        default:
            return nil
        }
    }

    var isNatural: Bool {
        Self.naturalCases.contains(self)
    }

    var accessibilityIDComponent: String {
        rawValue
            .replacingOccurrences(of: "#", with: "sharp")
            .replacingOccurrences(of: "/", with: "_")
    }
}
