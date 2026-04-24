import Foundation

enum GuitarString: Int, CaseIterable, Codable, Identifiable {
    case lowE
    case a
    case d
    case g
    case b
    case highE

    var id: Int { rawValue }

    var label: String {
        switch self {
        case .lowE:
            return "Low E"
        case .a:
            return "A"
        case .d:
            return "D"
        case .g:
            return "G"
        case .b:
            return "B"
        case .highE:
            return "High E"
        }
    }

    var openPitchClass: Int {
        switch self {
        case .lowE, .highE:
            return 4
        case .a:
            return 9
        case .d:
            return 2
        case .g:
            return 7
        case .b:
            return 11
        }
    }
}
