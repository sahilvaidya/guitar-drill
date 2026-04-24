import Foundation

enum NoteName: String, CaseIterable, Codable, Identifiable {
    case A
    case B
    case C
    case D
    case E
    case F
    case G

    var id: String { rawValue }

    init?(pitchClass: Int) {
        switch (pitchClass % 12 + 12) % 12 {
        case 0:
            self = .C
        case 2:
            self = .D
        case 4:
            self = .E
        case 5:
            self = .F
        case 7:
            self = .G
        case 9:
            self = .A
        case 11:
            self = .B
        default:
            return nil
        }
    }
}
