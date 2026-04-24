import Foundation

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

    var noteName: NoteName? {
        NoteName(pitchClass: pitchClass)
    }
}
