import XCTest

final class SafariSpeech: XCTestCase {
  @MainActor
  func testSafari() throws {
    let safari = XCUIApplication(bundleIdentifier: "com.apple.mobilesafari")
    safari.activate()
    XCTAssertTrue(safari.wait(for: .runningForeground, timeout: 20))
    let voice = XCUIDevice.shared.voiceOverService
    try voice.enable()
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
