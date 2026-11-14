import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {setTimeout as wait} from "node:timers/promises";
import {voiceOver as vo} from "@guidepup/guidepup";
const host = "https://dev.blackhaven-industries.pages.dev";
const checks = {
  company:["/","/capability/","/accessibility/","/privacy/"],
  galleries:["/portfolio/","/demo/"],
  rfq:["/rfq/"],
  rental:["/demo/equipment/"],
  tourism:["/demo/tourism/"],
  community:["/demo/community/"]
};
const apple=(...lines)=>execFileSync("osascript",lines.flatMap(x=>["-e",x]),{encoding:"utf8"}).trim();
const capture=name=>execFileSync("screencapture",["-x",name+".png"]);
const phrases=()=>vo.spokenPhraseLog();
async function seek(pattern, count=65) {
  for(let i=0;i<count;i++){
    await vo.press("Alt+Tab");
    if(pattern.test(await vo.lastSpokenPhrase())) return;
  }
  throw new Error("Focus not found: "+pattern);
}
const click=async pattern=>{await seek(pattern);await vo.press("Enter");await wait(600);};
const failures=[];
await vo.start();
try{
 for(const [index,path] of checks[process.env.CHECK].entries()){
  try{
   apple('tell application "Safari" to activate','tell application "Safari" to make new document with properties {URL:"'+host+path+'"}');
   await wait(3300);
   assert.equal(apple('tell application "Safari" to get URL of current tab of front window'),host+path);
   await vo.clearSpokenPhraseLog();
   await vo.nextHeading();
   assert.match(await vo.lastSpokenPhrase(),/heading/i);
   await vo.press("Meta+Digit0");
   for(let i=0;i<5;i++) await vo.press("Meta+Equals");
   if(index===0){
    apple('tell application "System Events" to tell process "Safari" to click menu item "Settings for dev.blackhaven-industries.pages.dev…" of menu 1 of menu bar item "Safari" of menu bar 1');
    await wait(500);capture("zoom");await vo.press("Escape");
   }
   if(process.env.CHECK==="rental"){
    await seek(/month stepper/i);
    for(let i=0;i<4;i++) await vo.press("Alt+Tab");
    await click(/save this request/i);
    capture("rental-saved");
    assert.match((await phrases()).join("\n"),/request saved/i);
   } else if(process.env.CHECK==="rfq"){
    await seek(/month stepper/i);
    for(let i=0;i<5;i++) await vo.press("Alt+Tab");
    capture("rfq-date");
    await click(/prepare.*email/i);
    capture("rfq-validation");
   } else if(process.env.CHECK==="tourism"){
    await click(/save .*button|add .*itinerary/i);
    capture("tourism-saved");
    await click(/remove .*button/i);
   } else if(process.env.CHECK==="community"){
    await click(/report an issue.*button|button.*report an issue/i);
    capture("community-form");
    for(let i=0;i<13;i++) await vo.press("Alt+Tab");
   } else {
    for(let i=0;i<(process.env.CHECK==="galleries"?15:10);i++) await vo.press("Alt+Tab");
    capture("route-"+index);
   }
  } catch(error){failures.push(path+": "+error.message);}
  console.log(JSON.stringify({path,speech:await phrases()},null,2));
 }
 assert.equal(failures.join("\n"),"");
} finally { await vo.stop(); }

