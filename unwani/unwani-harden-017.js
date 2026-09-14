/* عنواني 0.1.7-beta hardener. No official verification. Does not replace CSS. */
(function (g) {
  var U = g.Unwani;
  if (!U || typeof U.parseAddress !== "function") return;
  var ORIG = U.parseAddress;
  var DENY = { HTTP:1, JSON:1, TEST:1, HTML:1, NULL:1, TRUE:1, FALSE:1, CODE:1, NODE:1, FILE:1, PATH:1, PORT:1, HOST:1 };
  function lat(s) {
    s = String(s == null ? "" : s);
    var a = "٠١٢٣٤٥٦٧٨٩", e = "۰۱۲۳۴۵۶۷۸۹", o = "", i, j;
    for (i = 0; i < s.length; i++) {
      j = a.indexOf(s.charAt(i)); if (j >= 0) { o += String(j); continue; }
      j = e.indexOf(s.charAt(i)); if (j >= 0) { o += String(j); continue; }
      o += s.charAt(i);
    }
    return o;
  }
  function year(v) { var n = parseInt(lat(v), 10); return n >= 1900 && n <= 2100; }
  function zero(v) { return /^0+$/.test(lat(v).replace(/\D/g, "")); }
  function drop(c, k, w) {
    if (c[k]) { delete c[k]; if (w) w.push(k + "_rejected"); }
  }
  function wrap(input) {
    var raw = typeof input === "string" ? input : String(input && input.text != null ? input.text : "");
    if (raw.length > 4000) raw = raw.slice(0, 4000);
    var r = ORIG(raw);
    r.engine_version = "0.1.7-beta";
    r.official_verification = r.official_verification || {};
    r.official_verification.performed = false;
    r.official_verification.status = "OFFICIAL_LOOKUP_NOT_PERFORMED";
    r.geocode = null;
    var c = r.components || (r.components = {});
    var w = r.warnings || (r.warnings = []);
    if (c.short_address) {
      var nv = String(c.short_address.normalized_value || c.short_address.raw_value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      var letters = nv.slice(0, 4);
      if (DENY[letters] || year(nv.slice(4))) {
        drop(c, "short_address", w);
        if (c.building_number && c.building_number.evidence && String(c.building_number.evidence).indexOf("from_short") >= 0) drop(c, "building_number", w);
      }
    }
    if (c.makani_number) {
      var mk = lat(c.makani_number.normalized_value || "").replace(/\D/g, "");
      var after = raw.match(/(?:مكاني|makani)\s*[:#=-]?\s*([0-9٠-٩۰-۹]+)/i);
      if (!after || lat(after[1]).replace(/\D/g, "").length !== 10 || mk.length !== 10) {
        drop(c, "makani_number", w);
        w.push("makani_length_not_10");
      }
    }
    if (c.building_number && (zero(c.building_number.normalized_value) || (year(c.building_number.normalized_value) && !/مبنى|building|bldg/i.test(raw)))) {
      drop(c, "building_number", w);
    }
    if (c.district && c.district.raw_value) {
      var dc = String(c.district.raw_value).replace(/\s+(رقم|مبنى|شارع|الرمز).*$/i, "").trim();
      if (dc && dc !== c.district.raw_value) {
        c.district.raw_value = dc;
        c.district.normalized_value = lat(dc).trim();
      }
    }
    if (!c.unit) {
      var um = raw.match(/(?:شقة|شقه|وحدة|unit|apt\.?)\s*[:#=-]?\s*([0-9٠-٩A-Za-z-]{1,8})/i);
      if (um) c.unit = { field: "unit", raw_value: um[1], normalized_value: lat(um[1]).trim(), confidence: 0.86, source_span: null, evidence: ["unit_kw"], status: "parsed" };
    }
    if (!c.floor) {
      var fm = raw.match(/(?:دور|طابق|floor)\s*[:#=-]?\s*([0-9٠-٩]{1,3})/i);
      if (fm) c.floor = { field: "floor", raw_value: fm[1], normalized_value: lat(fm[1]).trim(), confidence: 0.84, source_span: null, evidence: ["floor_kw"], status: "parsed" };
    }
    var score = r.confidence && typeof r.confidence.score === "number" ? r.confidence.score : 0.2;
    if (score > 0.92) score = 0.92;
    if (score < 0.05) score = 0.05;
    r.confidence = r.confidence || { reasons: [] };
    r.confidence.score = score;
    r.pipeline = ["sanitize", "normalize", "detect", "extract", "validate", "lookup_stub"];
    return r;
  }
  U.parseAddress = wrap;
  U.parse = wrap;
  U.version = "0.1.7-beta";
})(typeof globalThis !== "undefined" ? globalThis : window);
