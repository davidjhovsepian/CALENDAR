# Capitalism Calendar

Concentric-ring liturgical calendar for the Holy Ex Machina Empire.

## Two ways to use it

### 1. As a React component
```jsx
import CapitalismCalendar from "./CapitalismCalendar.jsx";
<CapitalismCalendar zodiacBoundary="gregorian" /> // or "lichun"
```
No required props, no external state.

### 2. As a plugin — drop it into ANY app or site
`dist-capitalism-calendar.js` is a self-contained bundle (React and ReactDOM
included inside it) that registers a standard Web Component. This is what
makes it a true plugin rather than a React-only file — it works identically
in a React app, a Vue app, a static HTML page, a WordPress custom-HTML
block, a Shopify section, or a Webflow/Squarespace embed, because Web
Components are a browser standard, not a React one. The host app does not
need React installed.

```html
<script src="dist-capitalism-calendar.js"></script>
<capitalism-calendar zodiac-boundary="lichun"></capitalism-calendar>
```
That's the entire integration. See `demo.html` for a working minimal page.
Rebuild the bundle after editing the source with:
```
npx esbuild element.jsx --bundle --format=iife --jsx=automatic --minify --outfile=dist-capitalism-calendar.js
```

Attributes: `zodiac-boundary` — `"gregorian"` (default) or `"lichun"`.

Verified: the widget was mounted and rendered in a plain (non-React) DOM
with no other setup, confirming it works standalone as advertised.

## Ring order (outer → inner)
1. Chinese zodiac (12y cycle, real Gregorian year per beast)
2. Sanctorale (sacred/holiday markers, fixed to the solar year)
3. Month — Roman gods Jan-Jun (Janus/Februus/Mars/Venus/Maia/Juno, the only
   months Rome actually named after gods); Egyptian gods Jul-Dec (Sopdet/
   Sekhmet/Thoth/Anubis/Osiris/Horus — Quintilis/Sextilis/Sept-Dec were
   bare ordinals, never gods, so real deities were borrowed instead,
   chosen to trace a life-death-rebirth arc across the back half of the year)
4. Weekday — Germanic gods (Sunna, Máni, Tiw, Woden, Thor, Frigg, Saturn),
   matching real English etymology, not Roman
5. Moon phase at center — smiley (lit) vs skull (dark), sized asymmetrically
   so the smiley fully occludes the skull at full moon

Rotation is real-time and continuous: the gnomon's position inside any ring
segment always equals the elapsed fraction of that period. Leap years are
handled throughout (February's arc widens correctly, no drift at year end).

Daily I Ching oracle (deterministic per-date draw, full 64 hexagrams) lives
in the side panel along with sacred-day call-outs.

## Open threads
- October: Anubis vs. Nephthys (gender-balance + narrative fit both lean Nephthys)
- Long Count / precessional Age ring — planned as an innermost ring wrapping
  the moon (Aztec Sun Stone places its four prior Suns immediately around
  the central sun face, not on an outer ring), driven by the Meeus/IAU
  precession calculation (Age of Pisces began 68 BCE, Aquarius begins 2597 CE)

## Note on this repo
Built inside an AI sandbox with no durable server — git history here only
survives via the zip export you download, not automatically. See commit
log for what's actually changed.

## 3. As an iframe embed — for non-coders (Squarespace, Wix, Carrd, Notion...)

`capitalism-calendar-embed.html` is a single self-contained file — the
widget bundle is inlined directly into the page, so it's one file to host,
with zero other assets to upload.

**You have to host this file somewhere with a public URL first** — an AI
sandbox can't serve it live. Fastest options: drag the file onto
[Netlify Drop](https://app.netlify.com/drop) (no login needed, gives you a
URL in seconds), or upload it to Cloudflare Pages / your existing HEME
static hosting alongside the other pages.

Once it has a URL, embedding it is copy-paste for anyone, no code required:

- **Squarespace:** Add an "Embed Block" → paste the URL directly. (Or a
  Code Block with the iframe snippet below, on plans that support it.)
- **Wix / Carrd / Webflow / Notion:** same idea — an "Embed" or "iframe"
  block that takes a URL.
- **Anywhere raw HTML is allowed:**
  ```html
  <iframe src="https://your-domain.com/capitalism-calendar-embed.html"
          width="100%" height="900" style="border:0;" loading="lazy">
  </iframe>
  ```

900px height is a reasonable default — the layout is responsive and drops
to a single column below ~1000px wide, so it holds up in a narrower
Squarespace content column too.
