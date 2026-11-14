import { execFileSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { voiceOver } from "@guidepup/guidepup";

const base = "https://dev.blackhaven-industries.pages.dev/demo/meda/";
const apple = (...lines) => execFileSync("osascript", lines.flatMap(line => ["-e", line]), { encoding: "utf8" }).trim();
const visit = async path => {
  const url = base + path;
  apple('tell application "Safari" to activate', `tell application "Safari" to open location "${url}"`);
  await delay(3000);
  console.log(apple('tell application "Safari" to get URL of current tab of front window'));
};

console.log(apple('tell application "Safari" to get version'));
await voiceOver.start();
try {
  for (const path of ["samples/annual-report.pdf", "samples/meeting-agenda.pdf", "staff/"]) {
    await visit(path);
    await voiceOver.clearSpokenPhraseLog();
    for (let i = 0; i < (path.endsWith(".pdf") ? 35 : 12); i++) {
      if (path.endsWith(".pdf")) await voiceOver.next();
      else await voiceOver.nextHeading();
    }
    const speech = await voiceOver.spokenPhraseLog();
    console.log(JSON.stringify({ path, speech }, null, 2));
    if (path === "staff/") {
      await voiceOver.clearSpokenPhraseLog();
      // Safari page zoom advances through 115, 125, 150, 175, and 200.
      for (let i = 0; i < 5; i++) await voiceOver.press("Meta+Equals");
      await voiceOver.navigateNextUntil(/edit and preview sample annual report/i, { maxNavigationAttempts: 60 });
      await voiceOver.act();
      await delay(600);
      await voiceOver.press("Tab");
      await voiceOver.press("Tab");
      await voiceOver.press("ArrowUp");
      await voiceOver.press("Escape");
      await voiceOver.navigateNextUntil(/save draft/i, { maxNavigationAttempts: 40 });
      await voiceOver.act();
      await delay(1000);
      for (let i = 0; i < 14; i++) await voiceOver.next();
      console.log(JSON.stringify({ formNavigation: await voiceOver.spokenPhraseLog() }, null, 2));
    }
    if (path === "staff/" && !speech.some(line => /staff publishing/i.test(line))) {
      process.exitCode = 1;
    }
  }
} finally {
  await voiceOver.stop();
}




