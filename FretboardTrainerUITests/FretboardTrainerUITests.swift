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
        XCTAssertTrue(feedback.label.hasPrefix("Correct, E is correct."))
        XCTAssertTrue(feedback.label.contains("Time: "))
        XCTAssertTrue(app.staticTexts["last_correct_time_chip"].exists)
        XCTAssertTrue(app.staticTexts["average_last_five_time_chip"].exists)

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

    func testSettingsContainsPracticeModeFretRangeAndRecentMisses() throws {
        let app = XCUIApplication()
        app.launchArguments = ["UI_TEST_MODE", "-prompt-index", "0"]
        app.launch()

        app.buttons["answer_F"].tap()
        XCTAssertTrue(app.staticTexts["feedback_label"].waitForExistence(timeout: 2))

        app.buttons["settings_button"].tap()

        XCTAssertTrue(app.navigationBars["Settings"].waitForExistence(timeout: 2))
        XCTAssertTrue(app.segmentedControls["practice_mode_picker"].exists)
        XCTAssertTrue(app.steppers["fret_range_start_stepper"].exists)
        XCTAssertTrue(app.steppers["fret_range_end_stepper"].exists)
        XCTAssertTrue(app.staticTexts["recent_miss_0-0"].exists)
    }
}
