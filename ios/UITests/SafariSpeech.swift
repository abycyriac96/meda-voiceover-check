import XCTest

final class SafariSpeech: XCTestCase {
  @MainActor
  func testSafari() throws {
    let safari = XCUIApplication(bundleIdentifier: "com.apple.mobilesafari")
    safari.activate()
    XCTAssertTrue(safari.wait(for: .runningForeground, timeout: 20))
    let address = safari.textFields.matching(NSPredicate(format: "identifier CONTAINS[c] 'URL' OR label CONTAINS[c] 'address'")).firstMatch
    XCTAssertTrue(address.waitForExistence(timeout: 20), safari.debugDescription)
    address.tap()
    address.typeText("https://dev.blackhaven-industries.pages.dev/demo/meda/staff/\n")
    XCTAssertTrue(safari.staticTexts["Staff publishing"].waitForExistence(timeout: 25), safari.debugDescription)
    let voice = XCUIDevice.shared.voiceOverService
    if !voice.isEnabled { try voice.enable() }
    Thread.sleep(forTimeInterval: 3)
    if let output = try? voice.currentSpeech() { print("IPHONE_VOICEOVER_INITIAL: " + output.utterance) }
    defer { try? voice.disable() }
    var speech: [String] = []
    for _ in 0..<55 {
      do {
        let line = try voice.moveForward().utterance
        speech.append(line)
        print("IPHONE_VOICEOVER: " + line)
      } catch let error as XCUIVoiceOverService.Error where error.code == .noSpeech {}
      if speech.joined(separator: "\n").localizedCaseInsensitiveContains("Staff publishing") { break }
    }
    XCTAssertTrue(speech.joined(separator: "\n").localizedCaseInsensitiveContains("Staff publishing"))
  }
}


