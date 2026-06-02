import SwiftUI

@main
struct FretboardTrainerApp: App {
    @State private var session: PracticeSession

    init() {
        let config = LaunchConfiguration(arguments: ProcessInfo.processInfo.arguments)
        let store = config.usesEphemeralStats ? StatsStore.inMemory() : StatsStore()
        let engine = QuizEngine()
        _session = State(
            initialValue: PracticeSession(
                engine: engine,
                statsStore: store,
                initialPromptIndex: config.initialPromptIndex
            )
        )
    }

    var body: some Scene {
        WindowGroup {
            ContentView(session: session)
        }
    }
}

private struct LaunchConfiguration {
    let usesEphemeralStats: Bool
    let initialPromptIndex: Int?

    init(arguments: [String]) {
        usesEphemeralStats = arguments.contains("UI_TEST_MODE")

        if let promptFlagIndex = arguments.firstIndex(of: "-prompt-index"),
           arguments.indices.contains(promptFlagIndex + 1),
           let value = Int(arguments[promptFlagIndex + 1]) {
            initialPromptIndex = value
        } else {
            initialPromptIndex = nil
        }
    }
}
