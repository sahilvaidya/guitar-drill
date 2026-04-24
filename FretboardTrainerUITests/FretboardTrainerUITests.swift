import XCTest

final class FretboardTrainerUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    func testUserRetriesUntilCorrectAnswerThenAutoAdvances() throws {
        let app = XCUIApplication()
        app.launchArguments = ["UI_TEST_MODE", "-prompt-index", "0"]
        app.launch()

        let promptDescription = app.staticTexts["prompt_description"]
        XCTAssertTrue(promptDescription.exists)
        XCTAssertEqual(promptDescription.label, "Low E string, fret 0")
        XCTAssertTrue(app.otherElements["prompt_dot"].exists)

        app.buttons["answer_F"].tap()

        let feedback = app.staticTexts["feedback_label"]
        XCTAssertTrue(feedback.waitForExistence(timeout: 2))
        XCTAssertEqual(feedback.label, "Incorrect, Try again.")
        XCTAssertEqual(promptDescription.label, "Low E string, fret 0")
        XCTAssertFalse(app.buttons["next_note"].exists)

        app.buttons["answer_E"].tap()

        XCTAssertTrue(feedback.waitForExistence(timeout: 2))
        XCTAssertEqual(feedback.label, "Correct, E is correct.")

        let advancedPrompt = NSPredicate(format: "label == %@", "Low E string, fret 1")
        expectation(for: advancedPrompt, evaluatedWith: promptDescription)
        waitForExpectations(timeout: 4)
    }

    func testPracticePageDoesNotShowChromaticSetting() throws {
        let app = XCUIApplication()
        app.launchArguments = ["UI_TEST_MODE", "-prompt-index", "0"]
        app.launch()

        XCTAssertTrue(app.buttons["answer_A"].exists)
        XCTAssertFalse(app.buttons["answer_Fsharp_Gb"].exists)
        XCTAssertFalse(app.buttons["Chromatic"].exists)
        XCTAssertFalse(app.segmentedControls["practice_mode_picker"].exists)
    }
}
