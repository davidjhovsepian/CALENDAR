import { JSDOM } from "jsdom";
import fs from "fs";

const dom = new JSDOM(`<!doctype html><html><body>
  <capitalism-calendar zodiac-boundary="lichun"></capitalism-calendar>
</body></html>`, { runScripts: "dangerously", resources: "usable", url: "https://example.com/" });

global.window = dom.window;
global.document = dom.window.document;
global.customElements = dom.window.customElements;
global.HTMLElement = dom.window.HTMLElement;
global.requestAnimationFrame = dom.window.requestAnimationFrame || ((cb) => setTimeout(cb, 0));

const code = fs.readFileSync("./dist-capitalism-calendar.js", "utf8");
const script = dom.window.document.createElement("script");
script.textContent = code;
dom.window.document.head.appendChild(script);

await new Promise((r) => setTimeout(r, 300));

const el = dom.window.document.querySelector("capitalism-calendar");
const shadow = el.shadowRoot;
console.log("custom element registered:", !!dom.window.customElements.get("capitalism-calendar"));
console.log("shadow root attached:", !!shadow);

const before = shadow.innerHTML;
console.log("before: has Latin month names:", /JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER/.test(before));
console.log("before: has scribe toggle:", /Scribe Mode/.test(before));

// Click the Scribe Mode toggle
const toggle = [...shadow.querySelectorAll("button")].find(b => /Scribe Mode/.test(b.textContent));
console.log("toggle found:", !!toggle);
toggle.dispatchEvent(new dom.window.Event("click", { bubbles: true }));

await new Promise((r) => setTimeout(r, 200));

const after = shadow.innerHTML;
console.log("after: toggle now reads Common Tongue:", /Common Tongue/.test(after));
console.log("after: Latin month names gone from ring label:", !/JANUARY|FEBRUARY|MARCH(?!🏃)|APRIL|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER/i.test(after.match(/om-common[^<]*<[^>]*>[^<]*/g)?.join("") || ""));

// Pull out a few specific rendered glyph outputs for a sanity read
const eyebrowMatch = after.match(/om-eyebrow"[^>]*>([^<]*)</);
console.log("eyebrow sample (should be glyphs, not 'The Capitalism Calendar'):", eyebrowMatch && eyebrowMatch[1]);

const footMatch = after.match(/om-foot">([^<]*)</);
console.log("footer sample:", footMatch && footMatch[1]);

const bodyMatch = after.match(/om-body">([^<]*)</);
console.log("oracle body sample:", bodyMatch && bodyMatch[1]);

console.log("still contains ascii letters in eyebrow (should be false/minimal):", /[a-zA-Z]{3,}/.test(eyebrowMatch?.[1] || ""));

process.exit(0);
