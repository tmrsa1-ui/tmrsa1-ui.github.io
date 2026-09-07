/* Unwani engine IIFE — JavaScriptCore + browser. Single runtime copy. No network. No official verification. */
(function (global) {
"use strict";
/* Local-only Unwani engine for the PWA. Source of truth remains packages/*. */
const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const EXTENDED = "۰۱۲۳۴۵۶۷۸۹";

function toLatinDigits(input) {
  let out = "";
  for (const ch of input) {
    const i = ARABIC_INDIC.indexOf(ch);
    if (i >= 0) { out += String(i); continue; }
    const j = EXTENDED.indexOf(ch);
    if (j >= 0) { out += String(j); continue; }
    out += ch;
  }
  return out;
}

function capture(text, keyword, value) {
  const re = new RegExp("(?:" + keyword.source + ")\\s*[:#=-]?\\s*(" + value.source + ")", keyword.flags.includes("i") ? "i" : "");
  const m = re.exec(text);
  if (!m || m[1] == null) return null;
  const start = m.index + m[0].lastIndexOf(m[1]);
  return { raw: m[1], start, end: start + m[1].length };
}

function field(name, raw, span, evidence, confidence) {
  return {
    field: name,
    raw_value: raw,
    normalized_value: toLatinDigits(raw).replace(/\s+/g, " ").trim(),
    confidence,
    source_span: span,
    evidence,
    status: confidence < 0.6 ? "needs_review" : "parsed",
  };
}

function findAlias(text, table) {
  const low = text.toLowerCase();
  for (const row of table) {
    const aliases = [row.ar, ...row.en].sort((a, b) => b.length - a.length);
    for (const a of aliases) {
      const idx = low.indexOf(a.toLowerCase());
      if (idx >= 0) return { raw: text.slice(idx, idx + a.length), start: idx, end: idx + a.length, canon: row.ar };
    }
  }
  return null;
}

const SA_CITIES = [
  { ar: "الرياض", en: ["Riyadh", "Ar Riyadh"] },
  { ar: "جدة", en: ["Jeddah", "Jiddah"] },
  { ar: "مكة المكرمة", en: ["Makkah", "Mecca"] },
  { ar: "المدينة المنورة", en: ["Madinah", "Medina"] },
  { ar: "الدمام", en: ["Dammam"] },
  { ar: "الخبر", en: ["Khobar"] },
];
const SA_DIST = [
  { ar: "العارض", en: ["Al Arid", "Al-Arid"] },
  { ar: "النرجس", en: ["Al Narjis"] },
  { ar: "العليا", en: ["Al Olaya", "Al-Ulaya"] },
  { ar: "الصفا", en: ["Al Safa"] },
  { ar: "الشاطئ", en: ["Al Shati"] },
];
const AE_CITIES = [
  { ar: "دبي", en: ["Dubai"] },
  { ar: "أبوظبي", en: ["Abu Dhabi"] },
  { ar: "الشارقة", en: ["Sharjah"] },
];
const AE_AREAS = [
  { ar: "البرشاء الأولى", en: ["Al Barsha 1"] },
  { ar: "البرشاء", en: ["Al Barsha"] },
  { ar: "الخالدية", en: ["Al Khalidiyah"] },
];
const QA_CITIES = [
  { ar: "الدوحة", en: ["Doha"] },
  { ar: "الوكرة", en: ["Al Wakrah"] },
];

function detect(text) {
  const ascii = toLatinDigits(text);
  const scores = { SA: 0, AE: 0, QA: 0, BH: 0, KW: 0, OM: 0 };
  const ev = [];
  if (/\b[A-Za-z]{4}-?[0-9]{4}\b/.test(ascii) && !/\s[A-Za-z]{4}\s+\d{4}/.test(text)) {
    scores.SA += 0.55; ev.push("short_address");
  }
  if (/الرقم\s*الإضافي|الرقم\s*الاضافي|additional/i.test(text)) { scores.SA += 0.28; ev.push("additional"); }
  if (findAlias(text, SA_CITIES)) { scores.SA += 0.22; ev.push("sa_city"); }
  if (findAlias(text, SA_DIST)) { scores.SA += 0.2; ev.push("sa_district"); }
  if (/مكاني|makani/i.test(text) && /[0-9٠-٩]{10}/.test(text)) { scores.AE += 0.55; ev.push("makani"); }
  if (findAlias(text, AE_CITIES)) { scores.AE += 0.25; ev.push("ae_city"); }
  if (/مبنى\s*[0-9٠-٩]+/.test(text) && /شارع\s*[0-9٠-٩]+/.test(text) && /منطقة\s*[0-9٠-٩]+/.test(text)) {
    scores.QA += 0.55; ev.push("qa_triple");
  }
  if (/building\s+\d+.*street\s+\d+.*zone\s+\d+/i.test(text)) { scores.QA += 0.55; ev.push("qa_triple_en"); }
  if (findAlias(text, QA_CITIES)) { scores.QA += 0.25; ev.push("qa_city"); }
  if (/البحرين|bahrain|المنامة/i.test(text)) { scores.BH += 0.55; ev.push("bh_token"); }
  if (/الكويت|kuwait|قطعة|paci/i.test(text)) { scores.KW += 0.55; ev.push("kw_token"); }
  if (/عُمان|سلطنة عمان|\boman\b|مسقط|ولاية|سكة/i.test(text)) { scores.OM += 0.55; ev.push("om_token"); }
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [country, conf] = ranked[0];
  if (conf < 0.18) return { country: "UNKNOWN", address_system: "unknown", confidence: conf, evidence: ev, alternatives: [] };
  let system = "unknown";
  if (country === "SA") system = /\b[A-Za-z]{4}-?[0-9]{4}\b/.test(ascii) && text.trim().length <= 12 ? "sa_short_address" : "sa_national_address";
  if (country === "AE") system = /مكاني|makani/i.test(text) ? "ae_makani" : "ae_free_text";
  if (country === "QA") system = "qa_anwani";
  if (country === "BH") system = "bh_address";
  if (country === "KW") system = "kw_paci";
  if (country === "OM") system = "om_address";
  return { country, address_system: system, confidence: Math.min(1, conf), evidence: ev, alternatives: [] };
}

function extract(text, country) {
  const components = {};
  const warnings = [];
  const landmarks = [];
  const delivery_instructions = [];
  const add = (c) => { if (!components[c.field]) components[c.field] = c; };

  if (country === "SA") {
    const short = text.match(/\b([A-Za-z]{4})-?([0-9٠-٩]{4})\b/);
    if (short && !/\s/.test(short[0].replace(/-/g, ""))) {
      const compact = toLatinDigits(short[0]).replace(/[^A-Za-z0-9]/g, "").toUpperCase();
      add(field("short_address", short[0], { start: text.indexOf(short[0]), end: text.indexOf(short[0]) + short[0].length }, ["short_pattern"], 0.93));
      components.short_address.normalized_value = compact;
      add(field("building_number", compact.slice(4), null, ["from_short"], 0.8));
    }
    const extra = capture(text, /الرقم\s*الإضافي|الرقم\s*الاضافي|الرقم\s*الفرعي|additional(?:\s*number)?|add(?:itional)?\s*no\.?/i, /[0-9٠-٩]{4}/);
    if (extra) add(field("additional_number", extra.raw, extra, ["additional_kw"], 0.96));
    const postal = capture(text, /الرمز\s*البريدي|الرمز(?!\s*المختصر)|zip(?:\s*code)?|postal/i, /[0-9٠-٩]{5}/);
    if (postal) add(field("postal_code", postal.raw, postal, ["postal_kw"], 0.95));
    const bldg = capture(text, /رقم\s*المبنى|مبنى|عمارة|building|bldg/i, /[0-9٠-٩]{1,6}/);
    if (bldg) add(field("building_number", bldg.raw, bldg, ["building_kw"], 0.95));
    const streetAr = capture(text, /شارع|طريق/i, /[^\n,،;|]{2,60}/);
    if (streetAr) {
      const cleaned = streetAr.raw.replace(/\s+(حي|الرمز|الرقم|مبنى).*$/i, "").trim();
      if (cleaned.length > 1) add(field("street", cleaned, { start: streetAr.start, end: streetAr.start + cleaned.length }, ["street_kw"], 0.88));
    }
    const enStreet = text.match(/([A-Za-z][A-Za-z.'\- ]{2,40}?)\s+(?:St\.?|Street)\b/);
    if (enStreet && !components.street) add(field("street", enStreet[1].trim(), null, ["en_street"], 0.8));
    const dist = capture(text, /حي|district/i, /[^\n,،;|]{2,30}/);
    if (dist) add(field("district", dist.raw.replace(/\s+(شارع|مبنى|بعد).*$/i, "").trim(), dist, ["district_kw"], 0.9));
    const city = findAlias(text, SA_CITIES);
    if (city) add(field("city", city.raw, city, ["city_alias"], 0.92));
    const d2 = findAlias(text, SA_DIST);
    if (d2 && !components.district) add(field("district", d2.raw, d2, ["district_alias"], 0.82));
    const instr = text.match(/(بعد|خلف|مقابل|جنب|ثاني\s*لفة|يمين|يسار)[^,،\n]{0,60}/);
    if (instr) delivery_instructions.push(instr[0].trim());
    const lm = text.match(/مسجد\s+[^\s,،]{2,30}|مول\s+[^\s,،]{2,30}/);
    if (lm) landmarks.push(lm[0].trim());
    if (!components.building_number) {
      const numbered = capture(text, /رقم(?:\s*المبنى)?(?!\s*الإضافي)/i, /[0-9٠-٩]{1,6}/);
      if (numbered) add(field("building_number", numbered.raw, numbered, ["generic_number"], 0.45));
    }
    if (!components.building_number) {
      const four = text.match(/(?<![0-9٠-٩])([0-9٠-٩]{4})(?![0-9٠-٩])/);
      if (four) add(field("building_number", four[1], null, ["bare4"], 0.55));
    }
    if (!components.postal_code) {
      const five = text.match(/(?<![0-9٠-٩])([0-9٠-٩]{5})(?![0-9٠-٩])/);
      if (five) add(field("postal_code", five[1], null, ["bare5"], 0.62));
    }
  }

  if (country === "AE") {
    const mk = capture(text, /مكاني|makani/i, /[0-9٠-٩]{10}/);
    if (mk) add(field("makani_number", mk.raw, mk, ["makani_kw"], 0.97));
    const city = findAlias(text, AE_CITIES);
    if (city) add(field("city", city.raw, city, ["city_alias"], 0.9));
    const area = findAlias(text, AE_AREAS);
    if (area) add(field("area", area.raw, area, ["area_alias"], 0.82));
  }

  if (country === "QA") {
    const b = capture(text, /مبنى|building/i, /[0-9٠-٩]{1,6}/);
    if (b) add(field("building_number", b.raw, b, ["building_kw"], 0.94));
    const s = capture(text, /شارع|street/i, /[0-9٠-٩]{1,6}/);
    if (s) add(field("street_number", s.raw, s, ["street_no"], 0.94));
    const z = capture(text, /منطقة|منطقه|zone/i, /[0-9٠-٩]{1,3}/);
    if (z) add(field("zone_number", z.raw, z, ["zone_kw"], 0.93));
    const city = findAlias(text, QA_CITIES);
    if (city) add(field("city", city.raw, city, ["city_alias"], 0.9));
  }

  for (const m of text.matchAll(/مسجد\s+[^\s,،]{2,30}|مول\s+[^\s,،]{2,30}/g)) landmarks.push(m[0]);
  for (const m of text.matchAll(/(بعد|خلف|ثاني\s*لفة|يمين|يسار)[^,،\n]{0,40}/g)) delivery_instructions.push(m[0].trim());
  return { components, warnings, landmarks, delivery_instructions };
}

function format(components, country) {
  const g = (f) => components[f]?.normalized_value;
  const r = (f) => components[f]?.raw_value || g(f);
  const parts = [];
  if (country === "QA") {
    if (g("building_number")) parts.push("مبنى " + g("building_number"));
    if (g("street_number")) parts.push("شارع " + g("street_number"));
    if (g("zone_number")) parts.push("منطقة " + g("zone_number"));
    if (r("city")) parts.push(r("city"));
  } else if (country === "AE") {
    if (r("area")) parts.push(r("area"));
    if (r("city")) parts.push(r("city"));
    if (g("makani_number")) parts.push("مكاني " + g("makani_number"));
  } else {
    if (g("building_number") && r("street")) parts.push("مبنى " + g("building_number") + "، شارع " + r("street"));
    else if (g("building_number")) parts.push("مبنى " + g("building_number"));
    else if (r("street")) parts.push("شارع " + r("street"));
    if (r("district")) parts.push(r("district").startsWith("حي") ? r("district") : "حي " + r("district"));
    if (g("additional_number")) parts.push("الرقم الإضافي " + g("additional_number"));
    if (r("city")) parts.push(r("city"));
    if (g("postal_code")) parts.push(g("postal_code"));
    if (g("short_address")) parts.push("العنوان المختصر " + g("short_address"));
  }
  const ar = parts.join("، ");
  return { ar, en: null, shipping_ar: ar, shipping_en: null, short_code: g("short_address") || g("makani_number") || null };
}

function parseAddress(text) {
  const raw = typeof text === "string" ? text : String(text?.text ?? "");
  const detection = detect(raw);
  const extracted = extract(raw, detection.country);
  const keys = Object.keys(extracted.components);
  const warnings = extracted.warnings ? extracted.warnings.slice() : [];
  let status = "PARTIALLY_PARSED";
  if (detection.country === "BH" || detection.country === "KW" || detection.country === "OM") {
    status = "UNSUPPORTED_ADDRESS_SYSTEM";
    warnings.push("country_schema_only_not_parsed_in_mvp");
    warnings.push("نظام العنونة في هذه الدولة غير مدعوم بعد — المخطط موجود والمحلّل غير إنتاجي.");
  } else if (detection.country === "UNKNOWN") status = keys.length ? "PARTIALLY_PARSED" : "UNSUPPORTED_COUNTRY";
  else if (keys.length >= 4) status = "PARSED";
  else if (extracted.components.short_address || extracted.components.makani_number) status = "PARSED";
  else if (keys.length === 1 && extracted.components.city) status = "PARTIALLY_PARSED";
  else if (keys.length) status = "NEEDS_REVIEW";
  const reasons = [];
  if (keys.length) reasons.push({ code: "fields", message_ar: "استُخرجت " + keys.length + " مكونات من النص.", message_en: keys.length + " fields", polarity: "up" });
  reasons.push({ code: "no_official", message_ar: "لم يُجرَ تحقق من مصدر رسمي.", message_en: "No official lookup", polarity: "down" });
  const score = Math.max(0.15, Math.min(0.92, 0.3 + keys.length * 0.08 + detection.confidence * 0.2));
  return {
    schema_version: "1.0.0",
    country: detection.country,
    address_system: detection.address_system,
    raw_text: raw,
    normalization: { raw, display_normalized: raw.replace(/\s+/g, " ").trim(), search_normalized: toLatinDigits(raw).toLowerCase() },
    detection,
    components: extracted.components,
    delivery_instructions: extracted.delivery_instructions,
    landmarks: extracted.landmarks,
    unparsed_fragments: [],
    status,
    statuses: [status, "OFFICIAL_LOOKUP_NOT_PERFORMED"],
    official_verification: { performed: false, status: "OFFICIAL_LOOKUP_NOT_PERFORMED", source_name: null, source_url: null, retrieved_at: null, result_id: null, attribution: null, terms_applied: null, schema_version: null },
    geocode: null,
    formatted: format(extracted.components, detection.country),
    confidence: { score, reasons },
    ambiguities: [],
    warnings,
    ruleset: detection.country === "SA" ? "sa-1.0.0" : detection.country === "AE" ? "ae-1.0.0" : detection.country === "QA" ? "qa-1.0.0" : (detection.country === "BH" || detection.country === "KW" || detection.country === "OM") ? "schema-only-0.1.0" : "unknown-0.0.0",
  };
}

function compareRecords(a, b) {
  const matching = [];
  const conflicting = [];
  const missing = [];
  const fields = new Set([...Object.keys(a.components), ...Object.keys(b.components)]);
  for (const f of fields) {
    const va = a.components[f]?.normalized_value;
    const vb = b.components[f]?.normalized_value;
    if (va && vb && toLatinDigits(va).toLowerCase() === toLatinDigits(vb).toLowerCase()) matching.push(f);
    else if (va && vb) conflicting.push(f);
    else missing.push(f);
  }
  let decision = "insufficient_information";
  if (matching.length && !conflicting.length && !missing.length) decision = "exact";
  else if (matching.length >= 3 && conflicting.length === 0) decision = "likely_same";
  else if (matching.length >= 2) decision = "possible_match";
  else if (conflicting.length) decision = "different";
  const score = matching.length / Math.max(1, matching.length + conflicting.length);
  return {
    score: Math.round(score * 100) / 100,
    decision,
    matching,
    conflicting,
    missing,
    transliteration_matches: [],
    geographic_distance_m: null,
    needs_review: conflicting.length > 0 || missing.length > 0,
    explanation: { ar: "مطابقة " + matching.join("، ") + (conflicting.length ? "؛ تضارب " + conflicting.join("، ") : ""), en: decision },
  };
}


function compare(a, b) {
  const pa = (a && typeof a === "object" && a.components) ? a : parseAddress(String(a == null ? "" : a));
  const pb = (b && typeof b === "object" && b.components) ? b : parseAddress(String(b == null ? "" : b));
  return compareRecords(pa, pb);
}


function parse(input) {
  if (input && typeof input === "object" && input.text != null) return parseAddress(String(input.text));
  return parseAddress(String(input == null ? "" : input));
}

var api = {
  version: "0.1.0-beta",
  parseAddress: parse,
  parse: parse,
  compare: compare,
  toLatinDigits: toLatinDigits
};
global.Unwani = api;
if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : this);
