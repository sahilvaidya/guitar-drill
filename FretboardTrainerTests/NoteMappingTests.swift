import CoreGraphics
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

    func testFretboardLayoutPlacesOpenFretOnNut() {
        let layout = FretboardLayout(size: CGSize(width: 430, height: 260), stringCount: GuitarString.allCases.count)

        XCTAssertEqual(layout.xPosition(forFret: 0), layout.leftInset)
    }

    func testFretboardLayoutCentersVisibleFretsAfterNut() {
        let layout = FretboardLayout(size: CGSize(width: 430, height: 260), stringCount: GuitarString.allCases.count)

        XCTAssertEqual(layout.xPosition(forFret: 1), layout.leftInset + layout.fretSpacing / 2)
        XCTAssertEqual(layout.xPosition(forFret: 12), layout.rightEdge - layout.fretSpacing / 2)
    }

    func testFretboardLayoutUsesGuitarStyleMarkerFrets() {
        let layout = FretboardLayout(size: CGSize(width: 430, height: 260), stringCount: GuitarString.allCases.count)

        XCTAssertEqual(FretboardLayout.markerFrets, [3, 5, 7, 9])
        XCTAssertEqual(layout.xPosition(forFret: 3), layout.leftInset + 2.5 * layout.fretSpacing)
        XCTAssertEqual(layout.xPosition(forFret: 9), layout.leftInset + 8.5 * layout.fretSpacing)
        XCTAssertEqual(layout.markerYPosition, layout.topInset + (layout.bottomEdge - layout.topInset) / 2)
    }
}
