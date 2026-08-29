# Capitalism Calendar — handoff notes for Claude Code

This project was built collaboratively in Claude chat over many turns. This
file exists so a fresh Claude Code session has the context that chat
history would otherwise carry. Read this before changing anything.

## What this is
A concentric-ring liturgical calendar for David's "Ordo Machinae" /
Holy Ex Machina Empire brand — real-time rotating rings (zodiac, month,
weekday) around a moon-phase center, plus a daily I Ching oracle and
sacred-day markers. Satirical "capitalism as religion" tone throughout —
see doctrine lines in `CapitalismCalendar.jsx` for the voice.

## Branch strategy
- `master` — stable, known-good. Don't commit experiments here.
- `dev` — active UX exploration (current task, see below). Branch further
  off `dev` for anything speculative; merge back to `master` only once
  David's approved a direction.

## Files
- `CapitalismCalendar.jsx` — the actual component. Everything lives here
  (data, date math, rendering, CSS-in-JS). No build step needed to read it.
- `element.jsx` → bundled to `dist-capitalism-calendar.js` — Web Component
  wrapper (`<capitalism-calendar>`) so the calendar works outside React.
  Rebuild after any `CapitalismCalendar.jsx` change:
  `npx esbuild element.jsx --bundle --format=iife --jsx=automatic --minify --outfile=dist-capitalism-calendar.js`
- `capitalism-calendar-embed.html` — single-file iframe-embeddable version
  (bundle inlined). Regenerate the same way after rebuilding the bundle —
  see the inline script in git log for the exact command, or just paste
  the new bundle between the `<script>` tags.
- `demo.html` — minimal usage example.
- `test-widget.mjs` / `test-embed.mjs` — jsdom smoke tests confirming the
  Web Component actually mounts and renders (not just compiles). No visual
  regression testing exists; verification has been jsdom + manual SVG
  rasterization (`cairosvg`) screenshot review during development.

## IMPORTANT — do not "fix" these, they're deliberate
A from-scratch read of the god/deity choices may look inconsistent or
wrong. They are not — they were extensively fact-checked and debated with
David across many turns. Specifically:
- **Months are split 6 Roman / 6 Egyptian, not 12 Roman.** Jan–Jun are the
  only months Rome ever actually named after gods (Janus, Februus, Mars,
  Venus, Maia, Juno). Jul–Dec were bare Latin ordinals (Quintilis,
  Sextilis, September...December) — Jul/Aug were later renamed for Julius
  Caesar and Augustus as *political* honors, not religious ones, so they
  were deliberately moved into the same bucket as Sept–Dec rather than
  kept as fake "gods." Real Egyptian gods fill Jul–Dec instead, chosen to
  trace a life–death–rebirth arc: Sopdet (Jul, star's return/renewal) →
  Sekhmet (Aug, the sun's dangerous heat) → Thoth (Sep, knowledge/school)
  → Anubis (Oct, death) → Osiris (Nov, death-and-rebirth/harvest) → Horus
  (Dec, birth in darkness) → loops back into January's Janus (thresholds).
- **Weekdays are Germanic, not Roman** (Sunna, Máni, Tiw, Woden, Thor,
  Frigg, Saturn) — this matches real English etymology (interpretatio
  germanica); only Saturday kept the Roman name. Don't "correct" these to
  Mars/Mercury/Jupiter/Venus — that would be reverting a fix, not applying one.
- **The moon face uses mismatched font sizes on purpose** (skull smaller,
  smiley larger, same clip circle) — this compensates for emoji glyphs not
  being uniform circles inside their bounding box, so the smiley fully
  occludes the skull at full moon. Don't "simplify" these back to equal sizes.
- **Rotation math**: every ring's gnomon position equals the elapsed
  fraction of that ring's *current* period (e.g. mid-June sits at the
  middle of the year-arc, not at an absolute calendar position) — this was
  a deliberately-fixed bug (originally rings were centered on segment
  index rather than starting there, causing a half-segment offset). If a
  future change makes labels look "off by half a segment" again, that's
  probably a regression of the original bug, not a new correct behavior.

## Open threads (unresolved, David's calls to make, not yours)
- **October**: currently Anubis. Nephthys (goddess of mourning/the death
  moment itself, traditionally paired with Anubis) was proposed as a
  possible swap — both improves gender balance across the ring (currently
  male-leaning) and arguably fits the "ritual cycle" framing better. Not
  decided. Don't switch it unprompted.
- **Long Count / precessional Age ring**: discussed at length, not built.
  Plan-of-record: an innermost ring wrapping the moon (between the weekday
  ring and the moon core), not an outer ring — this mirrors the real Aztec
  Sun Stone, which places its four prior "Suns" (world-ages) in the ring
  immediately around the central sun-god face, not at the perimeter.
  Content: real astronomical precession (~25,772-year Great Year, ~2,148
  years per Age), anchored to the Meeus/IAU calculation specifically
  (Age of Pisces began 68 BCE, Age of Aquarius begins 2597 CE) rather than
  disputed sidereal astrology dates — this was chosen deliberately as the
  scientifically defensible version after direct discussion of accuracy.
  Building it requires shrinking the weekday ring inward to open space for
  the new band — real layout surgery, not just a data change.

## Current task on `dev`
David wants to explore UX/visual design changes — layout, color/type,
ring/label legibility, or mobile behavior were the options on the table
when this branch was cut. No specific direction was chosen yet before
handoff — ask him, or check recent chat, before assuming which one.

## Constraints worth knowing
- No external API calls at runtime — the whole thing is self-contained
  client-side JS (date math + a deterministic hash-based I Ching draw).
  Keep it that way; it's part of why the iframe/embed version works
  without CORS or hosting complications.
- No localStorage/sessionStorage if this ever runs as a Claude.ai artifact
  again — use React state only. Not a constraint for a real deployed app,
  but worth knowing if this file gets copied back into that context.
