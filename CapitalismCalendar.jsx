import React, { useState, useEffect, useMemo, useCallback } from "react";

/* ============================================================================
   THE CAPITALISM CALENDAR
   A liturgical instrument for the Holy Ex Machina Empire.

   Four concentric rings, rotating in real time against a fixed crimson gnomon:
     I    Zodiac ring    — the beast of the year (12y cycle, stem-branch element)
     II   Sanctorale     — the sacred days, fixed to the solar year
     III  Month ring     — the Roman tutelary deity of the month
     IV   Weekday ring   — the planetary god of the day
     ·    The Terminator — moon phase rendered as smile against skull

   Drop-in: <CapitalismCalendar />   No required props. No external state.
   ============================================================================ */

/* ---------------------------------------------------------------- DATA --- */

const ZODIAC = [
  { name: "Rat",     han: "鼠", emoji: "🐀", doctrine: "The year of first entry. Scarcity read correctly is opportunity read early." },
  { name: "Ox",      han: "牛", emoji: "🐂", doctrine: "The year of load. Nothing clever is rewarded; only what is carried." },
  { name: "Tiger",   han: "虎", emoji: "🐅", doctrine: "The year of the strike. Territory changes hands and does not change back." },
  { name: "Rabbit",  han: "兔", emoji: "🐇", doctrine: "The year of the burrow. Consolidate quietly; visibility is taxed." },
  { name: "Dragon",  han: "龍", emoji: "🐉", doctrine: "The year of ascent. Permissions are granted that will not be offered again." },
  { name: "Snake",   han: "蛇", emoji: "🐍", doctrine: "The year of the molt. The old configuration is shed or it strangles." },
  { name: "Horse",   han: "馬", emoji: "🐎", doctrine: "The year of velocity. Distance is bought with motion, not with planning." },
  { name: "Goat",    han: "羊", emoji: "🐐", doctrine: "The year of the herd. Alliance outperforms brilliance." },
  { name: "Monkey",  han: "猴", emoji: "🐒", doctrine: "The year of the exploit. The rules are found to have gaps in them." },
  { name: "Rooster", han: "雞", emoji: "🐓", doctrine: "The year of the signal. Announce, repeat, be counted." },
  { name: "Dog",     han: "狗", emoji: "🐕", doctrine: "The year of the ledger. Loyalty is audited and priced." },
  { name: "Pig",     han: "豬", emoji: "🐖", doctrine: "The year of the harvest. Consume what was built or lose it to decay." },
];

const ELEMENTS = ["Wood", "Fire", "Earth", "Metal", "Water"];

const MONTH_NAMES = ["January","February","March","April","May","June",
                     "July","August","September","October","November","December"];

/* Corrected against real etymology. Jan–Jun are the only months Rome ever
   actually named after gods. July and August were "Quintilis"/"Sextilis"
   (the fifth/sixth month — same bare-ordinal scheme as Sept–Dec) until the
   Senate renamed them for Julius Caesar and Augustus as political honors,
   not religious ones — so they belong with Sept–Dec, not with Jan–Jun.
   Real gods borrowed from Egypt govern all six: Jul–Dec, chosen for what
   these months actually are on the ground — the fire that guards a new
   sovereignty, the fire that tests it, school, death, harvest, a god born
   in the dark and immediately merchandised. The whole back half traces a
   life–death–rebirth arc: dissolution (Jul) → trial (Aug) → the mind's
   harvest (Sep) → death (Oct) → the mechanism of rebirth itself (Nov) →
   birth (Dec) → back into January's Threshold. */
const MONTH_GODS = [
  { rn: "I",    god: "Janus",  etym: "Ianuarius · the two-faced god of doorways",         domain: "The Threshold", doctrine: "Contracts opened. The fiscal instance is created and every door faces two directions." },
  { rn: "II",   god: "Februus",etym: "Februarius · god of purification, the Februa rites", domain: "The Purge",    doctrine: "Debts named aloud. Nothing is scoured that was not first admitted." },
  { rn: "III",  god: "Mars",   etym: "Martius · god of war",                              domain: "The Campaign",  doctrine: "War is planned before war is waged. The unplanned campaign is a donation." },
  { rn: "IV",   god: "Venus",  etym: "Aprilis · disputed, traditionally Venus/Aphrodite",  domain: "The Wanting",   doctrine: "Desire precedes the market. Where nothing is wanted, nothing can be sold." },
  { rn: "V",    god: "Maia",   etym: "Maius · goddess of growth, mother of Mercury",       domain: "The Growth",    doctrine: "Growth is the only proof of intent. What greens in May was decided months earlier." },
  { rn: "VI",   god: "Juno",   etym: "Iunius · queen of the gods, guardian of covenants",  domain: "The Covenant",  doctrine: "Alliances are ratified now. What is sworn in June is enforced for the rest of the cycle." },
  { rn: "VII",  god: "Sopdet", etym: "Iulius · originally Quintilis, \"the fifth\" — no real god; reassigned — Egyptian star-goddess whose return each year signaled the flood and the new year", domain: "The Rising", doctrine: "The star vanishes for seventy days and returns exactly on schedule. Sovereignty is not declared once — it has to reappear, on time, every year, or it was never real." },
  { rn: "VIII", god: "Sekhmet",etym: "Augustus · originally Sextilis, \"the sixth\" — no real god; reassigned — Egyptian goddess of the sun's destructive heat, the Eye of Ra", domain: "The Scorch", doctrine: "Ra's eye is loosed on the world and does not distinguish the guilty from the idle. Survive the heat; the harvest still needs you in September." },
  { rn: "IX",   god: "Thoth",  etym: "September · no Latin god; reassigned — Egyptian god of writing and knowledge", domain: "The Curriculum", doctrine: "What is learned in September is spent for the rest of the cycle. The syllabus does not care that summer just ended." },
  { rn: "X",    god: "Anubis", etym: "October · no Latin god; reassigned — Egyptian god of embalming and the weighed heart", domain: "The Veil", doctrine: "The dead are weighed, not mourned. Anubis does not care what the costume cost you — only what is under it." },
  { rn: "XI",   god: "Osiris", etym: "November · no Latin god; reassigned — Egyptian god of death, resurrection, and the grain", domain: "The Renewal", doctrine: "What was cut down returns green. The harvest is not an ending — it is a molt with better public relations." },
  { rn: "XII",  god: "Horus",  etym: "December · no Latin god; reassigned — Egyptian sky-god, born to Isis in the dark of winter", domain: "The Nativity", doctrine: "A god is born in the coldest week and is immediately merchandised. This is not new. It is the oldest trade there is." },
];

/* English weekday names are Germanic, not Roman — the Norse gods were
   swapped in for their Roman planetary counterparts (interpretatio
   germanica), except Saturday, which kept Saturn outright. That's why
   the glyphs below still carry the classical planetary symbol even
   though the god named is Norse. */
const DAY_GODS = [
  { day: "Sunday",    god: "Sunna", latin: "Sol",     glyph: "☉", domain: "Output",     doctrine: "The day of showing up. Compounding is indifferent to how you felt about it." },
  { day: "Monday",    god: "Mani",  latin: "Luna",    glyph: "☽", domain: "Reflection",  doctrine: "The day of the Mirror. What you believe about yourself is being priced by others." },
  { day: "Tuesday",   god: "Tiw",   latin: "Mars",    glyph: "♂", domain: "Conflict",    doctrine: "The day of the hard conversation. Tiw kept his oath at the cost of his hand — postponement is interest paid on cowardice." },
  { day: "Wednesday", god: "Woden", latin: "Mercury", glyph: "☿", domain: "Commerce",    doctrine: "The day of the deal. Woden traded an eye for wisdom at Mímir's well; you will trade something too, so choose what." },
  { day: "Thursday",  god: "Thor",  latin: "Jupiter", glyph: "♃", domain: "Force",       doctrine: "The day of the hammer. Ask for the larger number; the smaller one was never on offer." },
  { day: "Friday",    god: "Frigg", latin: "Venus",   glyph: "♀", domain: "Value",       doctrine: "The day of wanting. Price is a confession of what a thing is worth to someone else." },
  { day: "Saturday",  god: "Saturn",latin: "Saturn",  glyph: "♄", domain: "The Audit",   doctrine: "The day of limits. Debt, time, and the collector who eventually runs. Rome never lost this one." },
];

const PHASE_NAMES = [
  "New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous",
  "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent",
];

/* --- The Sanctorale.  month is 1-indexed.  `rule` handles movable feasts. -- */
const HOLIDAYS = [
  { m: 1,  d: 1,  name: "The Spawn",                doctrine: "The fiscal instance is created. Sovereign entities are instantiated today or they are not instantiated." },
  { m: 2,  d: 4,  name: "The Turning of the Beast", doctrine: "The outer ring advances. The year takes its animal and the animal takes the year." },
  { m: 3,  d: 15, name: "The Ides",                 doctrine: "The audit of trust. Count who is standing behind you and know why." },
  { m: 3,  d: 31, name: "The First Reckoning",      doctrine: "Quarter closed. The number is the number. Feelings are not entered in the ledger." },
  { m: 4,  d: 15, name: "The Great Tithe",          doctrine: "The Cathedral harvests. Pay it, and record exactly what it cost you to remain permitted." },
  { m: 5,  d: 1,  name: "The Root Injection",       doctrine: "The sovereign override. The day the Amortized may terminate the amortization schedule." },
  { m: 6,  d: 21, name: "Helios Ascendant",         doctrine: "Maximum light, maximum output. No excuse survives the longest day." },
  { m: 6,  d: 30, name: "The Second Reckoning",     doctrine: "Half the year is gone. Half of what you promised is not." },
  { m: 9,  d: 30, name: "The Third Reckoning",      doctrine: "Three quarters spent. Whatever has not shipped will not ship without violence." },
  { m: 10, d: 29, name: "The Great Liquidation",    doctrine: "Remembrance of the Sovereign Wager. Flawless execution guarantees nothing. That is the proof of divinity." },
  { m: 11, rule: "fourthFriday", name: "The Harvest", doctrine: "The high liturgy of the Feed. Watch the crowd with total attention and under no circumstances become it." },
  { m: 12, d: 21, name: "The Nigredo",              doctrine: "Longest dark. Dissolution is the first stage of the work, not the failure of it." },
  { m: 12, d: 25, name: "The Feast of the Simulacrum", doctrine: "Desire manufactured, wrapped, and sold back as tradition. Be praised." },
  { m: 12, d: 31, name: "The Reconciliation",       doctrine: "Books closed. Nothing carried forward that was not counted." },
];

/* --- The 64.  binary reads bottom line first; 1 = yang, 0 = yin. ---------- */
const HEXAGRAMS = [
  ["111111","Qián","The Creative","The Signal is unobstructed. Nothing in the field resists you; the only ceiling is your own nerve.","Build at full permission."],
  ["000000","Kūn","The Receptive","The ground before the build. The Market rewards the vessel before it rewards the blade.","Carry weight. Do not lead."],
  ["100010","Zhūn","Difficulty at the Beginning","The Spawn is always ugly. What you have made is not viable yet and this is the correct appearance of week one.","Do not abort the instance."],
  ["010001","Méng","Youthful Folly","You are operating a system you have not read. Ask the question you are embarrassed to ask.","Admit the missing manual."],
  ["111010","Xū","Waiting","The order is placed. Nothing you do accelerates the fill.","Hold the position. Eat."],
  ["010111","Sòng","Conflict","A dispute you can win will still cost more than it returns.","Settle. Redirect the capital."],
  ["010000","Shī","The Army","Discipline is the multiplier. A small force under one command outperforms a large one under none.","Consolidate command."],
  ["000010","Bǐ","Holding Together","Alliance is available at a price you can afford today and cannot afford tomorrow.","Bind the operator now."],
  ["111011","Xiǎo Xù","The Taming of the Small","Small accumulation. This is not the harvest — this is the seed inventory.","Bank the increment."],
  ["110111","Lǚ","Treading","You are walking on something dangerous that has not yet noticed you.","Move quietly. Do not gloat."],
  ["111000","Tài","Peace","The channel is open and capital is moving toward you.","Expand. The window is short."],
  ["000111","Pǐ","Standstill","The channel is closed and no volume of output opens it. The Market is not listening.","Stop broadcasting. Retrench."],
  ["101111","Tóng Rén","Fellowship","Others are running the same code. This is not competition — it is proof a market exists.","Find your congregation."],
  ["111101","Dà Yǒu","Great Possession","You hold more than you have counted. The inventory is the strategy.","Audit what you already own."],
  ["001000","Qiān","Modesty","The operator who does not announce the position keeps the position.","Suppress the announcement."],
  ["000100","Yù","Enthusiasm","Momentum is available but it is borrowed against the future. Spend it on one thing.","Point the energy."],
  ["100110","Suí","Following","Stop trying to lead the trend. Attach to it and take the toll.","Follow. Charge rent."],
  ["011001","Gǔ","Work on the Decayed","Something you built is rotting under maintenance you quietly stopped performing.","Repair the old vertical."],
  ["110000","Lín","Approach","The window opens and closes on a schedule you did not set.","Approach while it is open."],
  ["000011","Guān","Contemplation","You are being observed. Everything you do today is being priced by someone.","Perform correctly. Watch back."],
  ["100101","Shì Kè","Biting Through","An obstruction sits between you and the yield. It does not dissolve — it is bitten through.","Remove the blocker."],
  ["101001","Bì","Grace","Presentation is not decoration. The wrapper is part of the product.","Refine the surface."],
  ["000001","Bō","Splitting Apart","The structure is being stripped from beneath. Do not defend the whole.","Choose what to abandon."],
  ["100000","Fù","Return","The cycle bottoms here. The first increment of the new expansion is invisible and it has arrived.","Re-enter quietly."],
  ["100111","Wú Wàng","Innocence","Act without calculating the return and the return arrives. Calculate and it does not.","Do the obvious thing."],
  ["111001","Dà Xù","The Taming of the Great","Great accumulation held under restraint. Power stored is power multiplied.","Do not deploy yet."],
  ["100001","Yí","Nourishment","You are what you route into yourself. Check the inputs before blaming the output.","Audit your feed."],
  ["011110","Dà Guò","Great Exceeding","The beam is bearing more than it was rated for. Something load-bearing is going to fail.","Reduce the load now."],
  ["010010","Kǎn","The Abyss","Repeated danger. This is not one crisis — it is a shape you keep re-entering.","Learn the pattern or drown."],
  ["101101","Lí","The Clinging Fire","Illumination depends on what it consumes. Your visibility has a fuel cost.","Feed the fire deliberately."],
  ["001110","Xián","Influence","Attraction without pursuit. The field moves toward you the moment you stop reaching.","Emit. Do not chase."],
  ["011100","Héng","Duration","Duration beats intensity. The operator who ships weekly for four years cannot be caught.","Extend the streak."],
  ["001111","Dùn","Retreat","Withdrawal is a maneuver, not a defeat. Leave before the position becomes a cage.","Exit while it is cheap."],
  ["111100","Dà Zhuàng","Great Power","You have more force than judgment today. Force applied wrong breaks the thing it was meant to open.","Aim before you strike."],
  ["000101","Jìn","Progress","Advancement is recognized. Take the promotion in permissions, not in title.","Escalate the access."],
  ["101000","Míng Yí","Darkening of the Light","Conceal the Signal. Visibility today is liability.","Go dark. Keep building."],
  ["101011","Jiā Rén","The Family","Internal order determines external yield. A house that argues cannot ship.","Fix the household first."],
  ["110101","Kuí","Opposition","What you want and what they want overlap in a narrow band. Find it.","Trade the overlap only."],
  ["001010","Jiǎn","Obstruction","The path is blocked and the blockage is structural. Route around it; do not push.","Change the approach vector."],
  ["010100","Xiè","Deliverance","The tension releases. Do not immediately reload it.","Close the open loop."],
  ["110001","Sǔn","Decrease","Deliberate reduction. Cut what you like in order to fund what pays.","Cut one thing you love."],
  ["100011","Yì","Increase","Capital wants to move toward you. Increase compounds only if you refuse to consume it.","Reinvest the whole gain."],
  ["111110","Guài","Breakthrough","A resolution has to be declared in public. Silence here is complicity.","Say it out loud."],
  ["011111","Gòu","Coming to Meet","Something small and pleasant has entered the system. It is not small.","Inspect the new variable."],
  ["000110","Cuì","Gathering","Convene what is scattered before it decays separately.","Gather them in one room."],
  ["011000","Shēng","Pushing Upward","Ascent is available through steady effort with no dramatic event attached.","Climb. Expect no signal."],
  ["010110","Kùn","Oppression","Exhaustion under constraint. Resources are gone and the demand has not stopped.","Speak less. Conserve fuel."],
  ["011010","Jǐng","The Well","The source is fine. Your access to it is broken.","Repair the distribution."],
  ["101110","Gé","Revolution","The old configuration is dead and continuing to run it is now the only remaining risk.","Molt. Rebuild the shell."],
  ["011101","Dǐng","The Cauldron","Raw input becomes something the Market recognizes only under sustained heat.","Apply heat. Do not stir."],
  ["100100","Zhèn","The Arousing","Shock arrives. The operator who does not flinch takes the share of everyone who does.","Do not flinch."],
  ["001001","Gèn","Keeping Still","Stop the internal motion. Not rest — arrest.","Halt all processes."],
  ["001011","Jiàn","Gradual Progress","Development in correct sequence. Skipping a stage costs more than the stage.","Take the next step only."],
  ["110100","Guī Mèi","The Marrying Maiden","You are entering on unfavorable terms and calling it an opportunity.","Reread the contract."],
  ["101100","Fēng","Abundance","Peak. Abundance is a moment, not a state, and it is being measured right now.","Harvest at the top."],
  ["001101","Lǚ","The Wanderer","You are operating outside your territory with no standing in it.","Travel light. Offend no one."],
  ["011011","Xùn","The Gentle","Penetration by persistence. The pressure that wins is the one that never stops.","Apply constant small pressure."],
  ["110110","Duì","The Joyous","Exchange is pleasurable today. Pleasure is a currency and it is spending.","Trade in good faith."],
  ["010011","Huàn","Dispersion","Rigidity dissolves. What was frozen can now be moved.","Break up the blockage."],
  ["110010","Jié","Limitation","Constraint is the product. Unlimited scope has never produced anything.","Set the hard limit."],
  ["110011","Zhōng Fú","Inner Truth","Conviction transmits without argument. They believe the tone, not the evidence.","Speak from the center."],
  ["001100","Xiǎo Guò","Small Exceeding","Small excess is permitted. Large ambition today is punished.","Do the small thing well."],
  ["101010","Jì Jì","After Completion","Completed, and therefore beginning to decay. Order at its peak is order at its most fragile.","Guard the finished thing."],
  ["010101","Wèi Jì","Before Completion","Almost. The final stretch is where operators release the position too early.","Do not release early."],
];

const TRIGRAMS = {
  "111": ["Qián", "Heaven", "☰"], "000": ["Kūn", "Earth", "☷"],
  "100": ["Zhèn", "Thunder", "☳"], "010": ["Kǎn", "Water", "☵"],
  "001": ["Gèn", "Mountain", "☶"], "011": ["Xùn", "Wind", "☴"],
  "101": ["Lí", "Fire", "☲"],     "110": ["Duì", "Lake", "☱"],
};

/* ------------------------------------------------------------- MECHANICS -- */

const DAY_MS = 86400000;
const SYNODIC = 29.530588853;
const NEW_MOON_EPOCH = Date.UTC(2000, 0, 6, 18, 14, 0);

const startOfYear = (y) => new Date(y, 0, 1).getTime();
const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const daysInYear = (y) => (isLeap(y) ? 366 : 365);

function moonPhase(t) {
  const days = (t - NEW_MOON_EPOCH) / DAY_MS;
  return ((days % SYNODIC) + SYNODIC) % SYNODIC / SYNODIC;
}
const illumination = (p) => (1 - Math.cos(2 * Math.PI * p)) / 2;
const phaseName = (p) => PHASE_NAMES[Math.round(p * 8) % 8];

/* The solar year is the master gear. Every ring outside the week is driven by
   day-of-year, so the gnomon's position inside a segment IS the elapsed
   fraction of that segment's period. Jun 1 => start of the June arc. */
function yearProgress(t) {
  const d = new Date(t);
  const y = d.getFullYear();
  return { y, frac: (t - startOfYear(y)) / (daysInYear(y) * DAY_MS) };
}

/* boundary: "gregorian" — the beast owns Jan 1 to Dec 31 (matches the solar ring)
             "lichun"    — traditional; the beast turns at the Feb 4 solar term */
function zodiacProgress(t, boundary) {
  const d = new Date(t);
  const gy = d.getFullYear();
  let zy, within;
  if (boundary === "lichun") {
    zy = t < new Date(gy, 1, 4).getTime() ? gy - 1 : gy;
    const start = new Date(zy, 1, 4).getTime();
    const end = new Date(zy + 1, 1, 4).getTime();
    within = (t - start) / (end - start);
  } else {
    zy = gy;
    within = yearProgress(t).frac;
  }
  const idx = (((zy - 4) % 12) + 12) % 12;
  const stem = (((zy - 4) % 10) + 10) % 10;
  return {
    idx,
    within,
    element: ELEMENTS[Math.floor(stem / 2)],
    polarity: stem % 2 === 0 ? "Yang" : "Yin",
    zodiacYear: zy,
    cycleFrac: (idx + within) / 12,
  };
}

/* Month arcs are sized by their real day count — February is a narrower wedge
   than March — so the month ring and the Sanctorale share one gearing. */
function monthArcs(y) {
  const dpm = [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const total = daysInYear(y);
  let acc = 0;
  return dpm.map((d) => {
    const a0 = (acc / total) * 360;
    acc += d;
    return { a0, a1: (acc / total) * 360 };
  });
}
function weekProgress(t) {
  const d = new Date(t);
  const dow = d.getDay();
  const within = (d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()) / 86400;
  return { idx: dow, cycleFrac: (dow + within) / 7 };
}

function resolveHoliday(h, y) {
  if (h.rule === "fourthFriday") {
    const first = new Date(y, h.m - 1, 1);
    const offset = (5 - first.getDay() + 7) % 7;
    return new Date(y, h.m - 1, 1 + offset + 21);
  }
  return new Date(y, h.m - 1, h.d);
}
function holidaysFor(y) {
  return HOLIDAYS.map((h) => {
    const date = resolveHoliday(h, y);
    const doy = (date.getTime() - startOfYear(y)) / DAY_MS;
    return { ...h, date, frac: (doy + 0.5) / daysInYear(y) };
  });
}
const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/* Deterministic daily draw — every operator receives the same reading. */
function hashDate(d) {
  const s = `OM${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function castOracle(t) {
  const d = new Date(t);
  const h = hashDate(d);
  const primary = h % 64;
  const line = (h >>> 9) % 6;
  const bits = HEXAGRAMS[primary][0].split("");
  bits[line] = bits[line] === "1" ? "0" : "1";
  const target = bits.join("");
  const resulting = HEXAGRAMS.findIndex((x) => x[0] === target);
  return { primary, line, resulting };
}

/* ------------------------------------------------------------- GEOMETRY -- */

const C = 400; // centre of the 800×800 viewBox

const pt = (r, a) => {
  const rad = ((a - 90) * Math.PI) / 180;
  return [C + r * Math.cos(rad), C + r * Math.sin(rad)];
};

function ringSegment(rIn, rOut, a0, a1) {
  const large = a1 - a0 > 180 ? 1 : 0;
  const [x1, y1] = pt(rOut, a0);
  const [x2, y2] = pt(rOut, a1);
  const [x3, y3] = pt(rIn, a1);
  const [x4, y4] = pt(rIn, a0);
  return `M ${x1} ${y1} A ${rOut} ${rOut} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${rIn} ${rIn} 0 ${large} 0 ${x4} ${y4} Z`;
}

function moonLitPath(cx, cy, r, phase) {
  const cosT = Math.cos(2 * Math.PI * phase);
  const lit = (1 - cosT) / 2;
  if (lit >= 0.998) return `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`;
  if (lit <= 0.002) return "M 0 0";
  const rx = Math.abs(r * cosT);
  const waxing = phase < 0.5;
  const crescent = lit < 0.5;
  const outer = waxing ? 1 : 0;
  const inner = waxing ? (crescent ? 0 : 1) : crescent ? 1 : 0;
  return `M ${cx} ${cy - r} A ${r} ${r} 0 0 ${outer} ${cx} ${cy + r} A ${rx} ${r} 0 0 ${inner} ${cx} ${cy - r} Z`;
}

/* Ring geometry, outermost first. */
const RINGS = {
  zodiac: { rIn: 318, rOut: 386, n: 12 },
  sancta: { rIn: 292, rOut: 314, n: 0 },
  month:  { rIn: 224, rOut: 288, n: 12 },
  week:   { rIn: 156, rOut: 220, n: 7 },
  core:   { r: 150 },
  moon:   { r: 94 },
};

/* ------------------------------------------------------------ COMPONENT -- */

export default function CapitalismCalendar({ zodiacBoundary = "gregorian" } = {}) {
  const [tick, setTick] = useState(() => Date.now());
  const [offsetDays, setOffsetDays] = useState(0);
  const [selected, setSelected] = useState(null); // null => today's oracle

  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const t = tick + offsetDays * DAY_MS;
  const now = useMemo(() => new Date(t), [t]);

  const yr = useMemo(() => yearProgress(t), [t]);
  const zod = useMemo(() => zodiacProgress(t, zodiacBoundary), [t, zodiacBoundary]);
  const arcs = useMemo(() => monthArcs(yr.y), [yr.y]);
  const monthIdx = now.getMonth();
  const cycleBase = zod.zodiacYear - zod.idx; // first year of the running 12-year cycle
  const wk = useMemo(() => weekProgress(t), [t]);
  const phase = useMemo(() => moonPhase(t), [t]);
  const oracle = useMemo(() => castOracle(t), [Math.floor(t / DAY_MS)]);
  const sancta = useMemo(() => holidaysFor(yr.y), [yr.y]);
  const todayFeast = useMemo(() => sancta.find((h) => sameDay(h.date, now)) || null, [sancta, now]);

  const step = useCallback((n) => setOffsetDays((v) => v + n), []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "Escape") { setOffsetDays(0); setSelected(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  const rot = {
    zodiac: -zod.cycleFrac * 360,
    sancta: -yr.frac * 360,
    month: -yr.frac * 360,
    week: -wk.cycleFrac * 360,
  };

  /* ---- panel content ---- */
  const panel = useMemo(() => {
    if (selected?.kind === "zodiac") {
      const z = ZODIAC[selected.i];
      return {
        eyebrow: "Ring I · The Beast",
        title: `${z.emoji}  ${z.name}`,
        sub: `${z.han} · ${cycleBase + selected.i} · twelve-year cycle`,
        body: z.doctrine,
      };
    }
    if (selected?.kind === "month") {
      const m = MONTH_GODS[selected.i];
      return {
        eyebrow: `Ring III · Month ${m.rn}`,
        title: MONTH_NAMES[selected.i],
        sub: `${m.god} — ${m.domain}`,
        body: `${m.doctrine} (${m.etym})`,
      };
    }
    if (selected?.kind === "week") {
      const w = DAY_GODS[selected.i];
      return {
        eyebrow: "Ring IV · The Planetary Day",
        title: w.day,
        sub: `${w.glyph} ${w.god} — ${w.domain} · Roman equivalent: ${w.latin}`,
        body: w.doctrine,
      };
    }
    if (selected?.kind === "feast") {
      const f = sancta[selected.i];
      return {
        eyebrow: "The Sanctorale",
        title: f.name,
        sub: f.date.toLocaleDateString(undefined, { month: "long", day: "numeric" }),
        body: f.doctrine,
      };
    }
    return null;
  }, [selected, sancta, cycleBase]);

  const H = HEXAGRAMS[oracle.primary];
  const H2 = HEXAGRAMS[oracle.resulting];
  const lower = TRIGRAMS[H[0].slice(0, 3)];
  const upper = TRIGRAMS[H[0].slice(3, 6)];

  return (
    <div className="om-cal">
      <style>{CSS}</style>

      <div className="om-grid">
        {/* ========================= THE WHEEL ========================= */}
        <div className="om-wheel">
          <svg viewBox="0 0 800 800" role="img" aria-label="The Capitalism Calendar">
            <defs>
              <radialGradient id="omField" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#171320" />
                <stop offset="70%" stopColor="#0C0A10" />
                <stop offset="100%" stopColor="#060509" />
              </radialGradient>
              <radialGradient id="omCore" cx="50%" cy="45%" r="60%">
                <stop offset="0%" stopColor="#241B2C" />
                <stop offset="100%" stopColor="#0A0810" />
              </radialGradient>
              <clipPath id="omDisc">
                <circle cx={C} cy={C} r={RINGS.moon.r} />
              </clipPath>
              <clipPath id="omLit">
                <path d={moonLitPath(C, C, RINGS.moon.r, phase)} />
              </clipPath>
              <filter id="omGlow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="5" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            <circle cx={C} cy={C} r={394} fill="url(#omField)" />
            <circle cx={C} cy={C} r={393} fill="none" stroke="#C9A227" strokeWidth="1.4" opacity="0.55" />
            <circle cx={C} cy={C} r={388} fill="none" stroke="#C9A227" strokeWidth="0.5" opacity="0.3" />

            {/* ---- Ring I — the beast of the year ---- */}
            <g transform={`rotate(${rot.zodiac} ${C} ${C})`}>
              {ZODIAC.map((z, i) => {
                const a0 = i * 30;
                const a = a0 + 15; // label rides the middle of the arc
                const active = i === zod.idx;
                return (
                  <g key={z.name} className="om-seg" onClick={() => setSelected({ kind: "zodiac", i })}>
                    <path
                      d={ringSegment(RINGS.zodiac.rIn, RINGS.zodiac.rOut, a0, a0 + 30)}
                      fill={active ? "#3A0F18" : i % 2 ? "#100D16" : "#0B0910"}
                      stroke="#C9A227"
                      strokeWidth="0.6"
                      strokeOpacity={active ? 0.85 : 0.28}
                    />
                    <g transform={`rotate(${a} ${C} ${C})`}>
                      <text x={C} y={C - 366} className="om-emoji" fontSize="28" textAnchor="middle">{z.emoji}</text>
                      <text x={C} y={C - 344} className="om-godname" textAnchor="middle" fill={active ? "#F0D97A" : "#C9A227"} opacity={active ? 1 : 0.85}>{z.name.toUpperCase()}</text>
                      <text x={C} y={C - 329} className="om-year" textAnchor="middle" fill={active ? "#E5C86A" : "#8C7A3E"}>{z.han} {cycleBase + i}</text>
                    </g>
                  </g>
                );
              })}
            </g>

            {/* ---- The Sanctorale ---- */}
            <g transform={`rotate(${rot.sancta} ${C} ${C})`}>
              <circle cx={C} cy={C} r={(RINGS.sancta.rIn + RINGS.sancta.rOut) / 2} fill="none" stroke="#2E5E4E" strokeWidth={RINGS.sancta.rOut - RINGS.sancta.rIn} opacity="0.22" />
              {sancta.map((h, i) => {
                const a = h.frac * 360;
                const isToday = sameDay(h.date, now);
                return (
                  <g key={h.name} className="om-seg" onClick={() => setSelected({ kind: "feast", i })}>
                    <path d={ringSegment(RINGS.sancta.rIn, RINGS.sancta.rOut, a - 1.6, a + 1.6)} fill={isToday ? "#C81E33" : "#C9A227"} opacity={isToday ? 1 : 0.75} filter={isToday ? "url(#omGlow)" : undefined} />
                    <g transform={`rotate(${a} ${C} ${C})`}>
                      <circle cx={C} cy={C - 303} r={isToday ? 6.5 : 4} fill={isToday ? "#F0D97A" : "#0B0910"} stroke={isToday ? "#C81E33" : "#C9A227"} strokeWidth="1.4" />
                    </g>
                    <title>{h.name}</title>
                  </g>
                );
              })}
            </g>

            {/* ---- Ring III — the tutelary deity of the month ---- */}
            <g transform={`rotate(${rot.month} ${C} ${C})`}>
              {MONTH_GODS.map((m, i) => {
                const { a0, a1 } = arcs[i];
                const a = (a0 + a1) / 2;
                const active = i === monthIdx;
                return (
                  <g key={m.god} className="om-seg" onClick={() => setSelected({ kind: "month", i })}>
                    <path
                      d={ringSegment(RINGS.month.rIn, RINGS.month.rOut, a0, a1)}
                      fill={active ? "#3A0F18" : i % 2 ? "#120E19" : "#0D0A13"}
                      stroke="#C9A227"
                      strokeWidth="0.6"
                      strokeOpacity={active ? 0.85 : 0.28}
                    />
                    <g transform={`rotate(${a} ${C} ${C})`}>
                      <text x={C} y={C - 273} className="om-rn" textAnchor="middle" fill={active ? "#E5C86A" : "#8C7A3E"} opacity={active ? 1 : 0.8}>{m.rn}</text>
                      <text x={C} y={C - 253} className="om-common" textAnchor="middle" fill={active ? "#F0D97A" : "#C9A227"} opacity={active ? 1 : 0.9}>{MONTH_NAMES[i].toUpperCase()}</text>
                      <text x={C} y={C - 236} className="om-godname" textAnchor="middle" fill={active ? "#E5C86A" : "#9C8535"} opacity={active ? 1 : 0.85}>{m.god}</text>
                    </g>
                  </g>
                );
              })}
            </g>

            {/* ---- Ring IV — the planetary god of the day ---- */}
            <g transform={`rotate(${rot.week} ${C} ${C})`}>
              {DAY_GODS.map((w, i) => {
                const stepA = 360 / 7;
                const a0 = i * stepA;
                const a = a0 + stepA / 2;
                const active = i === wk.idx;
                return (
                  <g key={w.day} className="om-seg" onClick={() => setSelected({ kind: "week", i })}>
                    <path
                      d={ringSegment(RINGS.week.rIn, RINGS.week.rOut, a0, a0 + stepA)}
                      fill={active ? "#3A0F18" : i % 2 ? "#13111C" : "#0E0C15"}
                      stroke="#2E5E4E"
                      strokeWidth="0.8"
                      strokeOpacity={active ? 0.9 : 0.45}
                    />
                    <g transform={`rotate(${a} ${C} ${C})`}>
                      <text x={C} y={C - 206} className="om-planet" textAnchor="middle" fill={active ? "#F0D97A" : "#9FBFAF"} opacity={active ? 1 : 0.85}>{w.glyph}</text>
                      <text x={C} y={C - 187} className="om-common" textAnchor="middle" fill={active ? "#F0D97A" : "#C9A227"} opacity={active ? 1 : 0.9}>{w.day.toUpperCase()}</text>
                      <text x={C} y={C - 171} className="om-godname" textAnchor="middle" fill={active ? "#E5C86A" : "#8FAF9F"} opacity={active ? 1 : 0.85}>{w.god}</text>
                    </g>
                  </g>
                );
              })}
            </g>

            {/* ---- The Terminator ---- */}
            <circle cx={C} cy={C} r={RINGS.core.r} fill="url(#omCore)" stroke="#C9A227" strokeWidth="1" strokeOpacity="0.5" />
            <circle cx={C} cy={C} r={RINGS.core.r - 8} fill="none" stroke="#C9A227" strokeWidth="0.4" strokeOpacity="0.3" />
            <g className="om-seg" onClick={() => setSelected(null)}>
              <circle cx={C} cy={C} r={RINGS.moon.r + 6} fill="#050408" stroke="#2E5E4E" strokeWidth="1" strokeOpacity="0.6" />
              {/* Skull sized down and smiley sized up relative to the disc: emoji glyphs
                  aren't uniform circles inside their box (a skull's jaw/cheekbones push
                  further out than a rounded face does), so equal sizing leaves skull
                  visible at the edges even under a matching clip. The margin here is
                  deliberately generous so the smiley fully occludes regardless of which
                  emoji font renders it. */}
              <g clipPath="url(#omDisc)">
                <text x={C} y={C} className="om-face" fontSize={RINGS.moon.r * 1.82} textAnchor="middle" dominantBaseline="central">💀</text>
              </g>
              <g clipPath="url(#omLit)">
                <text x={C} y={C} className="om-face" fontSize={RINGS.moon.r * 2.42} textAnchor="middle" dominantBaseline="central">🙂</text>
              </g>
              <circle cx={C} cy={C} r={RINGS.moon.r} fill="none" stroke="#C9A227" strokeWidth="1.2" strokeOpacity="0.7" />
            </g>

            {/* ---- Plain reading of the present, upright and unrotating ---- */}
            <text x={C} y={C - 116} className="om-svgdate" textAnchor="middle">
              {`${DAY_GODS[wk.idx].day.slice(0, 3)} ${now.getDate()} ${MONTH_NAMES[monthIdx].slice(0, 3)} ${yr.y}`.toUpperCase()}
            </text>
            <text x={C} y={C + 130} className="om-svgphase" textAnchor="middle">
              {phaseName(phase).toUpperCase()}
            </text>

            {/* ---- The Gnomon — the fixed present ---- */}
            <line x1={C} y1={C - 386} x2={C} y2={C} stroke="#C81E33" strokeWidth="0.7" opacity="0.28" />
            <line x1={C} y1={C - 392} x2={C} y2={C - 158} stroke="#C81E33" strokeWidth="2.6" />
            <polygon points={`${C},${C - 146} ${C - 8},${C - 166} ${C + 8},${C - 166}`} fill="#C81E33" />
            <circle cx={C} cy={C - 394} r="11" fill="#0B0910" stroke="#C9A227" strokeWidth="2" />
            <circle cx={C} cy={C - 394} r="4.5" fill="#C81E33" filter="url(#omGlow)" />
          </svg>
        </div>

        {/* ========================= THE READING ========================= */}
        <aside className="om-panel">
          <header className="om-head">
            <div className="om-eyebrow">The Capitalism Calendar</div>
            <h1 className="om-date">
              {now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
            </h1>
            <div className="om-stamp">
              {now.getFullYear()} · {zod.polarity} {zod.element} {ZODIAC[zod.idx].name} · {now.toLocaleTimeString()}
            </div>
          </header>

          {todayFeast && (
            <div className="om-feast">
              <span className="om-feast-tag">Sacred Day</span>
              <strong>{todayFeast.name}</strong>
              <p>{todayFeast.doctrine}</p>
            </div>
          )}

          {panel ? (
            <section className="om-card">
              <div className="om-eyebrow">{panel.eyebrow}</div>
              <h2>{panel.title}</h2>
              <div className="om-sub">{panel.sub}</div>
              <p className="om-body">{panel.body}</p>
              <button className="om-back" onClick={() => setSelected(null)}>Return to the reading</button>
            </section>
          ) : (
            <section className="om-card">
              <div className="om-eyebrow">The Terminator · {phaseName(phase)}</div>
              <div className="om-illum">
                <div className="om-bar"><span style={{ width: `${illumination(phase) * 100}%` }} /></div>
                <span className="om-illum-n">{Math.round(illumination(phase) * 100)}% lit</span>
              </div>

              <div className="om-oracle">
                <div className="om-hexblock">
                  <Hexagram bits={H[0]} changing={oracle.line} />
                  <div className="om-hexlabel">{oracle.primary + 1}</div>
                </div>
                <div className="om-hextext">
                  <h2>{H[1]}</h2>
                  <div className="om-sub">{H[2]}</div>
                  <div className="om-trig">
                    {upper[2]} {upper[1]} over {lower[2]} {lower[1]}
                  </div>
                </div>
              </div>

              <p className="om-body">{H[3]}</p>
              <div className="om-directive">{H[4]}</div>

              <div className="om-change">
                <span className="om-eyebrow">Line {oracle.line + 1} moves →</span>
                <div className="om-changerow">
                  <Hexagram bits={H2[0]} small />
                  <div>
                    <strong>{H2[1]}</strong> · {H2[2]}
                    <p className="om-body om-small">{H2[3]}</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          <div className="om-controls">
            <button onClick={() => step(-1)} aria-label="Previous day">‹ Day</button>
            <button onClick={() => setOffsetDays(0)} disabled={offsetDays === 0}>
              {offsetDays === 0 ? "Present" : `Return · ${offsetDays > 0 ? "+" : ""}${offsetDays}d`}
            </button>
            <button onClick={() => step(1)} aria-label="Next day">Day ›</button>
          </div>
          <div className="om-foot">
            Rings turn against a fixed gnomon. Tap any segment to read its doctrine. Arrow keys scry forward and back.
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ HEXAGRAM -- */

function Hexagram({ bits, changing = -1, small = false }) {
  const w = small ? 44 : 66;
  const h = small ? 5 : 7;
  const gap = small ? 5 : 7;
  const lines = bits.split("").map(Number).reverse(); // draw top line first
  return (
    <svg width={w} height={(h + gap) * 6 - gap} viewBox={`0 0 ${w} ${(h + gap) * 6 - gap}`} className="om-hex">
      {lines.map((v, i) => {
        const y = i * (h + gap);
        const isChanging = 5 - i === changing;
        const fill = isChanging ? "#C81E33" : "#C9A227";
        return v === 1 ? (
          <rect key={i} x="0" y={y} width={w} height={h} fill={fill} />
        ) : (
          <g key={i}>
            <rect x="0" y={y} width={w * 0.42} height={h} fill={fill} />
            <rect x={w * 0.58} y={y} width={w * 0.42} height={h} fill={fill} />
          </g>
        );
      })}
    </svg>
  );
}

/* ----------------------------------------------------------------- CSS -- */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;800&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=JetBrains+Mono:wght@300;500&display=swap');

.om-cal{
  --ink:#08070C; --ink2:#0F0D16; --gold:#C9A227; --gold-lt:#F0D97A;
  --crimson:#C81E33; --oxblood:#3A0F18; --verd:#2E5E4E; --bone:#E6DFCD;
  background:
    radial-gradient(120% 90% at 50% 0%, #16121F 0%, #08070C 60%),
    var(--ink);
  color:var(--bone); min-height:100%; padding:clamp(14px,3vw,40px);
  font-family:'EB Garamond',Georgia,serif;
}
.om-grid{
  max-width:1240px; margin:0 auto; display:grid; gap:clamp(18px,3vw,44px);
  grid-template-columns:minmax(0,1fr);
}
@media(min-width:1000px){ .om-grid{ grid-template-columns:minmax(0,1.05fr) minmax(320px,.95fr); align-items:start; } }

.om-wheel svg{ width:100%; height:auto; display:block; }
.om-seg{ cursor:pointer; }
.om-seg:hover path[fill]:not([fill^="url"]){ filter:brightness(1.45); }
.om-seg:focus-visible{ outline:2px solid var(--gold-lt); }

.om-common{ font-family:'Cinzel',serif; font-size:13.5px; font-weight:600; letter-spacing:.13em; }
.om-year{ font-family:'JetBrains Mono',monospace; font-size:9.5px; letter-spacing:.1em; }
.om-svgdate{ font-family:'JetBrains Mono',monospace; font-size:13px; font-weight:500; letter-spacing:.2em; fill:#F0D97A; }
.om-svgphase{ font-family:'JetBrains Mono',monospace; font-size:8px; letter-spacing:.26em; fill:#7E9488; }
.om-micro{ font-family:'JetBrains Mono',monospace; font-size:7.5px; letter-spacing:.16em; }
.om-rn{ font-family:'Cinzel',serif; font-size:19px; font-weight:800; letter-spacing:.08em; }
.om-godname{ font-family:'Cinzel',serif; font-size:11.5px; font-weight:400; letter-spacing:.05em; font-style:italic; }
.om-planet{ font-size:24px; }

.om-panel{ display:flex; flex-direction:column; gap:16px; }
.om-eyebrow{
  font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:.28em;
  text-transform:uppercase; color:var(--gold); opacity:.85;
}
.om-date{
  font-family:'Cinzel',serif; font-weight:800; font-size:clamp(26px,4vw,40px);
  line-height:1.05; margin:.28em 0 .18em; color:var(--gold-lt); letter-spacing:.01em;
}
.om-stamp{ font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:.1em; color:#9C8F72; }

.om-feast{
  border-left:3px solid var(--crimson); background:linear-gradient(90deg,rgba(200,30,51,.14),transparent);
  padding:12px 16px;
}
.om-feast-tag{
  display:block; font-family:'JetBrains Mono',monospace; font-size:9px; letter-spacing:.28em;
  text-transform:uppercase; color:var(--crimson); margin-bottom:4px;
}
.om-feast strong{ font-family:'Cinzel',serif; font-size:18px; color:var(--gold-lt); }
.om-feast p{ margin:.4em 0 0; font-size:15px; line-height:1.55; color:#CFC6AE; }

.om-card{ border:1px solid rgba(201,162,39,.28); background:rgba(15,13,22,.72); padding:clamp(16px,2.4vw,24px); }
.om-card h2{ font-family:'Cinzel',serif; font-size:26px; font-weight:600; margin:.3em 0 .1em; color:var(--gold-lt); }
.om-sub{ font-style:italic; font-size:15px; color:#A79B7E; }
.om-body{ font-size:17px; line-height:1.6; margin:.9em 0 0; color:#DCD3BC; }
.om-small{ font-size:15px; }

.om-illum{ display:flex; align-items:center; gap:10px; margin-top:10px; }
.om-bar{ flex:1; height:3px; background:rgba(201,162,39,.2); }
.om-bar span{ display:block; height:100%; background:var(--gold-lt); }
.om-illum-n{ font-family:'JetBrains Mono',monospace; font-size:11px; color:#9C8F72; }

.om-oracle{ display:flex; gap:18px; align-items:center; margin-top:20px; padding-top:18px; border-top:1px solid rgba(201,162,39,.2); }
.om-hexblock{ text-align:center; }
.om-hexlabel{ font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--gold); margin-top:6px; letter-spacing:.14em; }
.om-hextext h2{ margin:0; }
.om-trig{ font-family:'JetBrains Mono',monospace; font-size:11px; color:#7E9488; letter-spacing:.08em; margin-top:6px; }

.om-directive{
  margin-top:14px; font-family:'Cinzel',serif; font-weight:600; font-size:15px;
  letter-spacing:.1em; text-transform:uppercase; color:var(--crimson);
  border-top:1px solid rgba(200,30,51,.3); padding-top:12px;
}
.om-change{ margin-top:18px; padding-top:14px; border-top:1px solid rgba(201,162,39,.2); }
.om-changerow{ display:flex; gap:14px; align-items:flex-start; margin-top:10px; }
.om-changerow strong{ font-family:'Cinzel',serif; color:var(--gold-lt); }

.om-controls{ display:flex; gap:8px; }
.om-controls button,.om-back{
  flex:1; background:transparent; border:1px solid rgba(201,162,39,.4); color:var(--gold);
  font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:.16em; text-transform:uppercase;
  padding:11px 8px; cursor:pointer; transition:background .18s,color .18s;
}
.om-back{ margin-top:18px; width:100%; }
.om-controls button:hover:not(:disabled),.om-back:hover{ background:var(--oxblood); color:var(--gold-lt); }
.om-controls button:disabled{ opacity:.4; cursor:default; }
.om-controls button:focus-visible,.om-back:focus-visible{ outline:2px solid var(--gold-lt); outline-offset:2px; }

.om-foot{ font-family:'JetBrains Mono',monospace; font-size:10px; line-height:1.7; letter-spacing:.06em; color:#6C6353; }

@media(prefers-reduced-motion:reduce){ .om-cal *{ transition:none !important; } }
`;
