import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";
import { voiceOver as vo } from "@guidepup/guidepup";

const base = "https://dev.blackhaven-industries.pages.dev/demo/meda/";
const apple = (...lines) => execFileSync("osascript", lines.flatMap(line => ["-e", line]), {encoding:"utf8"}).trim();
const visit = async path => {
  apple('tell application "Safari" to activate', 'tell application "Safari" to make new document with properties {URL:"' + base + path + '"}');
  await wait(5000);
  console.log(apple('tell application "Safari" to get URL of current tab of front window'));
};
const focus = async pattern => {
  for (let i=0; i<32; i++) {
    await vo.press("Alt+Tab");
    const phrase = await vo.lastSpokenPhrase();
    if (pattern.test(phrase)) return phrase;
  }
  throw Error("Could not focus " + pattern);
};
const capture = name => execFileSync("screencapture", ["-x", name + ".png"]);
await vo.start();
try {
  if (process.env.CHECK === "agenda") {
    await visit("samples/meeting-agenda.pdf");
    for (let depth=0; depth<4; depth++) {
      for (let i=0; i<22; i++) {
        await vo.next();
        if (/page 1 containing/i.test(await vo.lastSpokenPhrase())) break;
      }
      await vo.interact();
      const speech = (await vo.spokenPhraseLog()).join("\n");
      if (/Welcome[\s\S]*Discussion[\s\S]*Wrap.up/i.test(speech)) break;
    }
    assert.match((await vo.spokenPhraseLog()).join("\n"), /Welcome[\s\S]*Discussion[\s\S]*Wrap.up/i);
  } else {
    await visit("staff/");
    await vo.press("Meta+Digit0");
    for (let i=0; i<5; i++) await vo.press("Meta+Equals");
    capture("staff-zoom");
    await focus(/edit and preview sample annual report/i);
    await vo.press("Space");
    const before = await focus(/15 day stepper/i);
    await vo.press("Digit1");
    await vo.press("Digit6");
    await focus(/save draft/i);
    await vo.press("Space");
    await wait(1200);
    assert.match((await vo.spokenPhraseLog()).join("\n"), /Draft saved/i);
    await vo.press("Meta+r");
    await wait(2500);
    await focus(/edit and preview sample annual report/i);
    await vo.press("Space");
    const after = await focus(/16 day stepper/i);
    console.log({before,after});
    capture("saved-date");
  }
} finally {
  console.log(JSON.stringify(await vo.spokenPhraseLog(),null,2));
  await vo.stop();
}

