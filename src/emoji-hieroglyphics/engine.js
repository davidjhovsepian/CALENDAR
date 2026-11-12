/**
 * Emoji Hieroglyphics — Scribe Engine core
 * Deterministic encode/decode per Translator Spec v1.0 + Word-Group Rules v1.0.
 * Pure module: no DOM, no fetch. Pass a lexicon object in; get functions out.
 * Consumed by /web/index.html and /api/worker.js alike.
 */

const IRREG_VERB = {went:"go",ran:"run",ate:"eat",saw:"see",said:"say",spoke:"speak",
  drank:"drink",wrote:"write",built:"build",made:"make",bought:"buy",sold:"sell",
  gave:"give",took:"take",knew:"know",thought:"think",fought:"fight",came:"come",
  found:"find",paid:"pay",had:"have",lived:"live",died:"die",taught:"teach",
  sang:"sing",swam:"swim",flew:"fly",grew:"grow",threw:"throw",broke:"break",
  chose:"choose",froze:"freeze",stole:"steal",rose:"rise",drove:"drive",
  wore:"wear",tore:"tear",bore:"bear",swore:"swear",slept:"sleep",kept:"keep",
  left:"leave",felt:"feel",held:"hold",sent:"send",spent:"spend",lost:"lose",
  won:"win",sat:"sit",stood:"stand",understood:"understand",heard:"hear",
  fell:"fall",rode:"ride",struck:"strike",dug:"dig",hung:"hang",shook:"shake",
  woke:"wake",bit:"bite",hid:"hide",lay:"lie",led:"lead",fed:"feed",
  bled:"bleed",bred:"breed",met:"meet",shot:"shoot",troubleshot:"troubleshoot",cut:"cut",put:"put",
  read:"read",rang:"ring",sank:"sink",sprang:"spring",clung:"cling",
  swung:"swing",wound:"wind",ground:"grind",bound:"bind",sought:"seek",
  caught:"catch",brought:"bring",wept:"weep",crept:"creep",swept:"sweep",
  dealt:"deal",meant:"mean",dreamt:"dream",knelt:"kneel",leapt:"leap"};

// Past participles (Rule PART1). They carry the same ⏪ as the simple past;
// the perfect and passive auxiliaries in front of them are handled in encode().
const IRREG_PART = {seen:"see",gone:"go",eaten:"eat",taken:"take",written:"write",
  given:"give",known:"know",spoken:"speak",driven:"drive",broken:"break",
  chosen:"choose",frozen:"freeze",stolen:"steal",risen:"rise",worn:"wear",
  torn:"tear",borne:"bear",born:"bear",sworn:"swear",fallen:"fall",ridden:"ride",
  shaken:"shake",woken:"wake",bitten:"bite",hidden:"hide",drunk:"drink",
  sung:"sing",swum:"swim",flown:"fly",grown:"grow",thrown:"throw",begun:"begin",
  forgotten:"forget",gotten:"get",forgiven:"forgive",beaten:"beat",
  shown:"show",sunk:"sink",sprung:"spring",rung:"ring",sewn:"sew",
  forbidden:"forbid",proven:"prove",mistaken:"mistake",undertaken:"undertake",
  overcome:"overcome",withdrawn:"withdraw",arisen:"arise",striven:"strive",
  woven:"weave",slain:"slay",smitten:"smite",trodden:"tread",shrunk:"shrink",
  swollen:"swell",mown:"mow",sown:"sow",
  // "done" = brought to completion; "do" itself is an unwritten auxiliary
  done:"finish"};

const IRREG_PLURAL = {children:"child",men:"man",women:"woman",feet:"foot",
  teeth:"tooth",geese:"goose",mice:"mouse",people:"person",oxen:"ox",
  lice:"louse",dice:"die",knives:"knife",wives:"wife",lives:"life",
  wolves:"wolf",leaves:"leaf",halves:"half",thieves:"thief",loaves:"loaf",
  shelves:"shelf",selves:"self",calves:"calf",elves:"elf",scarves:"scarf"};

const IRREG_ADJ = {better:"good",best:"good",worse:"bad",worst:"bad"};

const SAT_PRE = {"⏪":"[past] ","▶️":"[ongoing] ","⏩":"[future] ","🚫":"not "};

/* Context cues for choosing between senses of a homograph (Rule HOM1).
   These are closed lists, so inference stays deterministic. */
const DETERMINERS = new Set(["the","a","an","this","that","these","those","my","your",
  "his","her","its","our","their","some","any","every","each","no","another","one",
  // counted nouns behave the same way: "two walks", "three trades"
  "two","three","four","five","six","seven","eight","nine","ten","many","few","several"]);
const AUXILIARIES = new Set(["is","are","was","were","be","been","being","am","will",
  "would","can","could","shall","should","must","may","might","do","does","did",
  "has","have","had","let","to"]);
const BE_HAVE = new Set(["is","are","was","were","be","been","being","am","has","have","had"]);
const PREPOSITIONS = new Set(["in","on","at","of","for","with","from","by","into",
  "onto","upon","within","through","across","over","under","about","against",
  "toward","towards","between","among","during","before","after","behind"]);
/* A subject pronoun in front is strong evidence the next word is the verb:
   "i walk", "they cook", "she trades". Without this cue the default sense
   would have to be a verb, which mis-reads common nouns like water and light. */
// Negators: "do not X", "don't X", "never X" — the negated word is an action.
// ("do" itself is dropped by ART1, so the negator is the word immediately before.)
// "never" always negates an action; "not" only when a do-form or modal stands
// before it ("do not worry", "will not worry") — a bare "not water" stays a noun.
const NEGATORS = new Set(["never","cannot"]);
const NOT_HOSTS = new Set(["do","does","did","will","would","can","could","shall","should","may","might","must"]);
const SUBJECT_PRONOUNS = new Set(["i","you","he","she","we","they","who","it"]);

export function createEngine(data){
  const LEX = {}, REV = {}, SENSES = {};
  for(const [lemma, e] of Object.entries(data.lexicon)){
    LEX[lemma] = e;
    // every entry has a sense list; single-sense entries synthesise one
    SENSES[lemma] = e.senses || [{pos:e.pos, glyph:e.glyph}];
    for(const s of SENSES[lemma]) if(!REV[s.glyph]) REV[s.glyph] = lemma;
  }
  const FUNC = data.function_words;
  for(const [w,g] of Object.entries(FUNC)) if(g && !REV[g]) REV[g] = w;
  const PHON = data.phonograms || {};
  const REDIR = data.redirects || {};

  /* Does this lemma have a sense of the given part of speech? */
  function senseOf(lemma, pos){
    const list = SENSES[lemma];
    if(!list) return null;
    return list.find(s => s.pos === pos) || null;
  }
  function hasPos(lemma, pos){ return !!senseOf(lemma, pos); }
  function isHomograph(lemma){ return (SENSES[lemma] || []).length > 1; }

  /* Rule HOM1 — pick a sense using surrounding words.
     Returns {sense, why} or null to accept the primary sense. */
  function inferSense(lemma, ctx){
    const list = SENSES[lemma];
    if(!list || list.length < 2) return null;
    const {prev, next, morph} = ctx;

    // 1. Morphology is decisive when it can only belong to one class.
    if((morph.past || morph.ing) && hasPos(lemma,"verb"))
      return {sense: senseOf(lemma,"verb"), why: "tense morphology"};
    if(morph.adverb && hasPos(lemma,"adv"))
      return {sense: senseOf(lemma,"adv"), why: "-ly"};

    // 2. What comes before is the strongest positional cue.
    if(prev){
      // "a general rule": determiner + this word + a noun → this word is the
      // attributive adjective, the following word is the head noun.
      if(DETERMINERS.has(prev) && hasPos(lemma,"adj") && next && LEX[lemmatize(next).lemma]
         && (LEX[lemmatize(next).lemma].pos==="noun" || hasPos(lemmatize(next).lemma,"noun")))
        return {sense: senseOf(lemma,"adj"), why: `attributive — "${next}" is the head noun`};
      if(DETERMINERS.has(prev) && hasPos(lemma,"noun"))
        return {sense: senseOf(lemma,"noun"), why: `after determiner "${prev}"`};
      // be/have take a participle, never a bare verb: a bare word after them is
      // the thing named ("it is water", "we have water"). Tensed forms were
      // already caught by morphology above.
      if(BE_HAVE.has(prev) && hasPos(lemma,"noun"))
        return {sense: senseOf(lemma,"noun"), why: `bare form after "${prev}"`};
      if(AUXILIARIES.has(prev) && hasPos(lemma,"verb"))
        return {sense: senseOf(lemma,"verb"), why: `after auxiliary "${prev}"`};
      if((NEGATORS.has(prev) || (prev==="not" && NOT_HOSTS.has(ctx.prev2))) && hasPos(lemma,"verb"))
        return {sense: senseOf(lemma,"verb"), why: `after negator "${prev}"`};
      if(SUBJECT_PRONOUNS.has(prev) && hasPos(lemma,"verb"))
        return {sense: senseOf(lemma,"verb"), why: `after subject "${prev}"`};
      if(PREPOSITIONS.has(prev) && hasPos(lemma,"noun"))
        return {sense: senseOf(lemma,"noun"), why: `after preposition "${prev}"`};
      // an adjective in front means the word is being modified → noun
      if(LEX[prev] && LEX[prev].pos === "adj" && hasPos(lemma,"noun"))
        return {sense: senseOf(lemma,"noun"), why: `after adjective "${prev}"`};
    }

    // NOTE: a bare -s is deliberately NOT used as a cue. "walks" is a plural
    // noun in "the walks were long" and a verb in "he walks home"; the suffix
    // alone cannot tell them apart, and the determiner rule above already
    // catches the noun reading. Treating -s as noun evidence mis-reads every
    // third-person verb.

    // 3. A determiner immediately after suggests this word takes an object → verb.
    if(next && DETERMINERS.has(next) && hasPos(lemma,"verb"))
      return {sense: senseOf(lemma,"verb"), why: `object follows ("${next}")`};

    return null; // fall back to the primary sense
  }

  // Rule NAME1: names have no logogram — spell phonetically, sign per letter.
  // Returns the raw sign sequence; wrap in a cartouche for display (web/cartouche.html).
  function spellName(name){
    const letters = name.toLowerCase().replace(/[^a-z]/g,"").split("");
    const signs = letters.map(ch => PHON[ch] || "❔");
    return { signs, glyph: signs.join(""), letters };
  }

  function lemmatize(w){
    if(w==="been")      return {lemma:"be", past:true, plural:false, participle:true};
    if(IRREG_VERB[w])   return {lemma:IRREG_VERB[w],   past:true,  plural:false};
    if(IRREG_PART[w])   return {lemma:IRREG_PART[w],   past:true,  plural:false, participle:true};
    if(IRREG_PLURAL[w]) return {lemma:IRREG_PLURAL[w], past:false, plural:true};
    if(IRREG_ADJ[w])    return {lemma:IRREG_ADJ[w],    past:false, plural:false};
    let past=false, plural=false, ing=false, lemma=w;
    const tryL = c => (LEX[c]||FUNC[c]!==undefined) ? c : null;
    // -ves → -f/-fe plurals for unknown stems (knives, wolves, leaves)
    if(w.endsWith("ves") && w.length>4 && !LEX[w] && FUNC[w]===undefined){
      const f=w.slice(0,-3)+"f", fe=w.slice(0,-3)+"fe";
      if(tryL(f)){lemma=f;plural=true}
      else if(tryL(fe)){lemma=fe;plural=true}
      else {lemma=f;plural=true}
    }
    else if(w.endsWith("ies") && tryL(w.slice(0,-3)+"y")){lemma=w.slice(0,-3)+"y";plural=true}
    else if(w.endsWith("es") && tryL(w.slice(0,-2))){lemma=w.slice(0,-2);plural=true}
    else if(w.endsWith("s") && w.length>3 && tryL(w.slice(0,-1))){lemma=w.slice(0,-1);plural=true}
    // Unknown-stem plurals: strip regular -es/-s even when the singular
    // isn't in the lexicon, so "guardians" and "guardian" fall back to the
    // SAME glyph (+👥) instead of 📦 vs 👤. Guard against -ss/-us/-is endings.
    else if(w.endsWith("ies") && w.length>4 && !LEX[w] && FUNC[w]===undefined){lemma=w.slice(0,-3)+"y";plural=true}
    else if(w.endsWith("es") && w.length>4 && /(s|x|z|ch|sh|o)es$/.test(w) && !/(ss|us|is)es$/.test(w) && !LEX[w] && FUNC[w]===undefined){lemma=w.slice(0,-2);plural=true}
    else if(w.endsWith("s") && !w.endsWith("ss") && !w.endsWith("us") && w.endsWith("is")===false && w.length>3 && !LEX[w] && FUNC[w]===undefined){lemma=w.slice(0,-1);plural=true}
    else if(w.endsWith("ied") && tryL(w.slice(0,-3)+"y")){lemma=w.slice(0,-3)+"y";past=true}
    else if(w.endsWith("ed")){
      lemma = tryL(w.slice(0,-2)) || tryL(w.slice(0,-1)) ||
              tryL(w.slice(0,-2).replace(/(.)\1$/,"$1")) || w;
      if(lemma!==w) past=true;
    }
    else if(w.endsWith("ing")){
      lemma = tryL(w.slice(0,-3)) || tryL(w.slice(0,-3)+"e") ||
              tryL(w.slice(0,-3).replace(/(.)\1$/,"$1")) || w;
      if(lemma!==w) ing=true;
    }
    else if(w.endsWith("ly") && tryL(w.slice(0,-2))){
      return {lemma:w.slice(0,-2), adverb:true};
    }
    return {lemma, past, plural, ing};
  }

  // Spec §10 — unknown words never fail
  function fallback(lemma){
    if(/(er|or|ist|ian)$/.test(lemma) && lemma.length>4)
      return {glyph:"👤",rule:"FALLBACK.person",gloss:"unknown person/role"};
    if(/(tion|sion|ness|ment|ity|ism|ance|ence)$/.test(lemma))
      return {glyph:"🧠📦",rule:"FALLBACK.abstract",gloss:"unknown concept"};
    if(/(ize|ise|ate|ify)$/.test(lemma))
      return {glyph:"🏃",rule:"FALLBACK.action",gloss:"unknown action"};
    return {glyph:"📦",rule:"FALLBACK.thing",gloss:"unknown object"};
  }

  // Rule CON1: contractions are unpacked before encoding, so "don't" reads as
  // "do not" (do → dropped by ART1, not → 🚫). A bare 's is expanded to "is"
  // only after pronouns and question words; elsewhere it is possessive.
  const IS_HOSTS = ["it","he","she","that","what","there","here","who","where","when","how","this"];
  function expandContractions(t){
    return t
      .replace(/\bwon't\b/g,"will not").replace(/\bcan't\b/g,"can not")
      .replace(/\bshan't\b/g,"shall not").replace(/\bain't\b/g,"is not")
      .replace(/\blet's\b/g,"let us")
      .replace(/\b([a-z]+)n't\b/g,"$1 not")
      .replace(/\b([a-z]+)'m\b/g,"$1 am").replace(/\b([a-z]+)'re\b/g,"$1 are")
      .replace(/\b([a-z]+)'ve\b/g,"$1 have").replace(/\b([a-z]+)'ll\b/g,"$1 will")
      .replace(/\b([a-z]+)'d\b/g,"$1 would")
      .replace(new RegExp("\\b("+IS_HOSTS.join("|")+")'s\\b","g"),"$1 is");
  }

  // Spec §8
  function encode(text){
    const tokens = expandContractions(text.toLowerCase().replace(/[\u2018\u2019]/g,"'"))
      .match(/[a-z']+|[.,!?;:]/g) || [];
    const out=[], trace=[];
    for(let i=0; i<tokens.length; i++){
      const t = tokens[i];
      if(/[.,!?;:]/.test(t)){
        out.push(t);
        trace.push({token:t,lemma:null,glyph:t,rule:"PUNCT",gloss:"preserved, not encoded"});
        continue;
      }
      // Rules PERF1 / COP2 — auxiliaries that only carry grammar.
      {
        const nx = tokens[i+1] && /^[a-z']+$/.test(tokens[i+1]) ? tokens[i+1] : null;
        // look past a negator: "have not seen", "has never been"
        const nxv = (nx==="not"||nx==="never") && tokens[i+2] && /^[a-z']+$/.test(tokens[i+2]) ? tokens[i+2] : nx;
        const isParticiple = w => w && (w==="been" || lemmatize(w).past===true);
        // PERF1: have/has/had + participle — the participle already carries ⏪,
        // so the auxiliary adds nothing ("I have seen" ≠ "I possess seeing").
        if((t==="have"||t==="has"||t==="had") && isParticiple(nxv)){
          trace.push({token:t,lemma:t,glyph:null,rule:"PERF1",gloss:"perfect auxiliary — dropped, the participle carries ⏪"});
          continue;
        }
        // COP2: be/been before a complement is the copula, unwritten like "is".
        // "been" keeps its tense: ⏪, as "was" does. Without a complement
        // ("to be or not to be") the word is the verb of existence.
        const LINKS = new Set(["or","and","nor","but","not"]);
        if((t==="be"||t==="been") && nx && !LINKS.has(nx)){
          if(t==="be"){
            trace.push({token:t,lemma:"be",glyph:null,rule:"COP2",gloss:"copula before a complement — unwritten (ART1)"});
          } else if(out[out.length-1]!=="⏪"){
            out.push("⏪");
            trace.push({token:t,lemma:"be",glyph:"⏪",rule:"COP2",gloss:"copula, past — tense only, like \"was\""});
          } else {
            trace.push({token:t,lemma:"be",glyph:null,rule:"COP2",gloss:"copula — tense already written"});
          }
          continue;
        }
      }
      if(FUNC[t]!==undefined){
        const g=FUNC[t];
        if(g===""){
          trace.push({token:t,lemma:t,glyph:null,rule:"ART1",gloss:"dropped — no articles/copula in the script"});
          continue;
        }
        out.push(g);
        trace.push({token:t,lemma:t,glyph:g,rule:"FUNCTION",gloss:"closed-class sign"});
        continue;
      }
      const m = lemmatize(t);
      let entry = LEX[m.lemma];
      let rule="LEXICON", gloss="";

      // Rule HOM1: a lemma may hold several senses. Choose by context before
      // anything else runs, so tense guards and derivation see the right one.
      if(entry && isHomograph(m.lemma)){
        const prev = tokens[i-1] && /^[a-z']+$/.test(tokens[i-1]) ? tokens[i-1] : null;
        const next = tokens[i+1] && /^[a-z']+$/.test(tokens[i+1]) ? tokens[i+1] : null;
        const prev2 = tokens[i-2] && /^[a-z']+$/.test(tokens[i-2]) ? tokens[i-2] : null;
        const pick = inferSense(m.lemma, {prev, prev2, next, morph:m});
        if(pick){
          entry = pick.sense;
          rule = `HOMOGRAPH → ${pick.sense.pos}`;
          gloss = `${pick.sense.pos} sense, ${pick.why}`;
        } else {
          rule = `HOMOGRAPH → ${entry.pos}`;
          gloss = `${entry.pos} sense, default`;
        }
      }
      if(!entry){
        // REDIRECT: check synonym table before falling back to primitives
        const rTarget = REDIR[m.lemma];
        if(rTarget){
          const tLemma = typeof rTarget==="object" ? rTarget[0] : rTarget;
          if(LEX[tLemma]){ entry=LEX[tLemma]; rule=`REDIRECT → ${tLemma}`; gloss=`≈ ${tLemma}`; }
          else if(FUNC[tLemma]!==undefined && FUNC[tLemma]!==""){
            entry={glyph:FUNC[tLemma]}; rule=`REDIRECT → ${tLemma}`; gloss=`≈ ${tLemma}`;
          }
        }
      }
      if(!entry){
        const stem = m.lemma.match(/^(.*?)(?:er|or)$/);
        if(stem){
          const cands=[stem[1], stem[1]+"e", stem[1].replace(/(.)\1$/,"$1")];
          for(const c of cands){
            if(!LEX[c]) continue;
            // COMPARATIVE (Rule ADJ3): adjective + -er → adjective + ➕
            const adj = senseOf(c,"adj");
            if(adj){
              entry={glyph: adj.glyph+"➕", pos:"adj"};
              rule=`DERIVED → ${c}+➕`; gloss=`comparative of ${c} (Rule ADJ3)`;
              break;
            }
            // AGENT (Rule N4): verb + -er/-or → verb core + 🧍 person.
            // Checks every sense, so an agent still derives from a word whose
            // primary sense is a noun (e.g. work → worker).
            const vb = senseOf(c,"verb");
            if(vb){
              entry={glyph: vb.glyph.replace("🏃","")+"🧍", pos:"noun"};
              rule=`DERIVED → ${c}+🧍`; gloss=`agent of ${c} (Rule N4)`;
              break;
            }
          }
        }
      }
      if(!entry){
        const fb=fallback(m.lemma);
        entry={glyph:fb.glyph}; rule=fb.rule; gloss=fb.gloss;
      } else if(rule==="LEXICON") gloss = entry.pos;
      // English 3rd-person -s on verbs is conjugation, not plurality (V2:
      // the script marks aspect by satellite, person not at all)
      if(entry.pos === "verb" && m.plural){ m.plural = false; }
      // GUARD: past/ongoing tense only means anything on a VERB. If regular
      // morphology (-ed/-ing) matched a NOUN lemma (e.g. "taped" hitting the
      // noun "tape"), that noun has no verb sense yet — treat as genuinely
      // unknown rather than nonsensically tensing a thing. Re-run fallback.
      if((m.past || m.ing) && entry.pos && entry.pos !== "verb"){
        const fb=fallback(m.lemma);
        entry={glyph:fb.glyph, pos:null}; rule=fb.rule;
        gloss=fb.gloss+` (no verb sense for "${m.lemma}" yet)`;
        m.past=false; m.ing=false;
      }
      let g = entry.glyph;
      // PASS1: after was/were/been the past is already written once — a
      // participle does not write it again ("were watered" = ⏪ 💧🌱🏃).
      if(m.past && out[out.length-1]==="⏪"){ m.past=false; gloss+=" · past already marked (PASS1)"; }
      if(m.past){ g="⏪"+g; gloss+=" · past ⏪ (V2)"; }
      if(m.ing){ g="▶️"+g; gloss+=" · ongoing ▶️ (V2)"; }
      if(m.plural && !g.includes("👥")){ g=g+"👥"; gloss+=" · plural 👥 (N3)"; }
      if(m.adverb){ g=g+"〰️"; gloss+=" · adverb 〰️ (ADV1)"; }
      out.push(g);
      trace.push({token:t,lemma:m.lemma,glyph:g,rule,gloss:gloss||"direct match"});
    }
    return {result: out.join(" "), trace, version: data.version};
  }

  // Spec §9
  function decode(text){
    const words = text.trim().split(/\s+/).filter(Boolean);
    const out=[], trace=[];
    for(let w of words){
      if(/^[.,!?;:]$/.test(w)){out.push(w);continue;}
      let prefix="", raw=w;
      for(const s of Object.keys(SAT_PRE)){
        if(w.startsWith(s)){prefix+=SAT_PRE[s]; w=w.slice(s.length);}
      }
      let plural=false, hit=REV[w], rule="EXACT";
      if(!hit && w.endsWith("👥")){
        const chars=[...w]; chars.pop();
        const stripped=chars.join("");
        if(REV[stripped]){hit=REV[stripped];plural=true;}
      }
      if(!hit){
        // Determinative-safe stripping: only remove signs from the closed
        // classifier inventory (Egyptian principle — determinatives are
        // never independently readable words, so stripping them is safe;
        // stripping arbitrary signs can land on a different word).
        const DETS = data.determinatives ||
          ["🏃","🦴","🌀","🧠","📜","🧍","🧬","⚖️","💰","✅","📍","🏢","📄","🎯","⏳","🔗","📚","🎓"];
        const chars=[...w];
        for(let cut=1; cut<=2 && chars.length-cut>=1 && !hit; cut++){
          const removed = chars[chars.length-cut];
          if(!DETS.includes(removed)) break;
          const partial=chars.slice(0,chars.length-cut).join("");
          if(REV[partial]){hit=REV[partial];rule="PARTIAL (determinative stripped)";}
        }
      }
      if(!hit){hit="[?]";rule="UNKNOWN";}
      out.push(prefix+hit+(plural?"-s":""));
      trace.push({glyph:raw,lemma:hit,rule,gloss:plural?"plural 👥 detected":""});
    }
    return {result: out.join(" "), trace, version: data.version};
  }

  function lookup(lemma){
    const k = lemma.toLowerCase();
    const e = LEX[k];
    if(!e) return null;
    return {lemma:k, ...e, senses: SENSES[k], version:data.version};
  }

  return {encode, decode, lookup, spellName, senseOf, hasPos, isHomograph,
          size:Object.keys(LEX).length};
}
