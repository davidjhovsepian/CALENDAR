/**
 * Glyph-translation bridge for the Capitalism Calendar.
 *
 * Vendors the Emoji Hieroglyphics engine + compiled lexicon
 * (davidjhovsepian/emoji, lexicon v{see lexicon.json}) directly into this
 * project as static data — no network call, no API, nothing that can go
 * down or get rate-limited. That matches this project's existing rule
 * (see CLAUDE.md "Constraints"): no external API calls at runtime, the
 * whole thing stays self-contained client-side JS. `engine.js` is a pure
 * module with no DOM/fetch of its own, so dropping it in here is exactly
 * the reuse path it was built for.
 *
 * Re-sync: copy the latest src/engine.js and data/lexicon.json from the
 * emoji repo over the files in this folder. Nothing else needs to change —
 * the engine takes the whole lexicon object as data, so a version bump
 * there just flows through.
 */
import { createEngine } from "./engine.js";
import lexiconData from "./lexicon.json";

const engine = createEngine(lexiconData);

/**
 * Translate ordinary English prose/phrases into Emoji Hieroglyphics.
 * Unknown words never fail — they degrade to the engine's primitive
 * glyphs (📦 thing, 🧠📦 concept, 👤 person, 🏃 action) per its own
 * fallback rules, so this never throws and never returns empty for
 * non-empty input.
 */
export function glyphText(text) {
  if (!text) return text;
  try {
    const { result } = engine.encode(String(text));
    return result || text;
  } catch {
    return text;
  }
}

/**
 * Spell a proper name phonetically, sign-per-letter (Rule NAME1 — names
 * have no logogram in the script). Used for deity names, which the
 * general lexicon correctly has no entries for. Returns the raw sign
 * run with no cartouche frame — the cartouche is reserved for dedicated
 * name-plates, not inline UI text.
 */
export function glyphName(name) {
  if (!name) return name;
  try {
    const { glyph } = engine.spellName(String(name));
    return glyph || name;
  } catch {
    return name;
  }
}

export const lexiconVersion = lexiconData.version;
export const lexiconSize = engine.size;
