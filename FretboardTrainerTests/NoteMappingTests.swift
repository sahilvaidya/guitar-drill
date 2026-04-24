import XCTest
@testable import FretboardTrainer

final class NoteMappingTests: XCTestCase {
    func testNaturalNoteMappingAcrossStrings() {
        XCTAssertEqual(FretPosition(string: .lowE, fret: 0).noteName, .E)
        XCTAssertEqual(FretPosition(string: .lowE, fret: 1).noteName, .F)
        XCTAssertEqual(FretPosition(string: .a, fret: 2).noteName, .B)
        XCTAssertEqual(FretPosition(string: .d, fret: 2).noteName, .E)
        XCTAssertEqual(FretPosition(string: .g, fret: 4).noteName, .B)
        XCTAssertEqual(FretPosition(string: .highE, fret: 12).noteName, .E)
    }

    func testChromaticPositionsAreExcludedFromNaturalNotes() {
        XCTAssertNil(FretPosition(string: .lowE, fret: 2).noteName)
        XCTAssertNil(FretPosition(string: .b, fret: 2).noteName)
    }

    func testChromaticNoteMappingIncludesAccidentals() {
        XCTAssertEqual(FretPosition(string: .lowE, fret: 2).chromaticNoteName, .FSharpGFlat)
        XCTAssertEqual(FretPosition(string: .a, fret: 1).chromaticNoteName, .ASharpBFlat)
        XCTAssertEqual(FretPosition(string: .b, fret: 2).chromaticNoteName, .CSharpDFlat)
    }
}
