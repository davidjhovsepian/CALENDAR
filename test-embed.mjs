import { JSDOM } from "jsdom";
import fs from "fs";

const html = fs.readFileSync("capitalism-calendar-embed.html", "utf8");
const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable", url: "https://example.com/" });

global.window = dom.window;
global.document = dom.window.document;
global.customElements = dom.window.customElements;
global.HTMLElement = dom.window.HTMLElement;
global.requestAnimationFrame = dom.window.requestAnimationFrame || ((cb) => setTimeout(cb, 0));

await new Promise((r) => setTimeout(r, 400));

const el = dom.window.document.querySelector("capitalism-calendar");
const shadow = el && el.shadowRoot;
console.log("element present:", !!el);
console.log("shadow root:", !!shadow);
console.log("svg rendered:", !!(shadow && shadow.querySelector("svg")));
const styleTag = dom.window.document.querySelector("style");
console.log("responsive css present:", /min-width:1000px/.test(styleTag.textContent));
console.log("single self-contained file, no external requests needed: true (no <script src> or <link> tags present):",
  !/<script[^>]+src=/.test(html) && !/<link/.test(html));
process.exit(0);
