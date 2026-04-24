import XCTest

final class FretboardTrainerUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    func testUserCanAnswerPromptAndAdvance() throws {
        let app = XCUIApplication()
        app.launchArguments = ["UI_TEST_MODE", "-prompt-index", "0"]
        app.launch()

        XCTAssertTrue(app.staticTexts["prompt_description"].exists)
        XCTAssertTrue(app.otherElements["prompt_dot"].exists)

        app.buttons["answer_E"].tap()

        let feedback = app.staticTexts["feedback_label"]
        XCTAssertTrue(feedback.waitForExistence(timeout: 2))
        XCTAssertEqual(feedback.label, "Correct, E is correct.")

        let nextButton = app.buttons["next_note"]
        XCTAssertTrue(nextButton.exists)
        nextButton.tap()

        XCTAssertTrue(feedback.waitForNonExistence(timeout: 2))
    }
}
