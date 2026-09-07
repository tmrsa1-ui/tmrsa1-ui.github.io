/* عنواني 0.1.6 patch — unit/floor + extra aliases. No official verification. */
(function () {
  var U = globalThis.Unwani;
  if (!U || !U.parseAddress) return;
  U.version = "0.1.6-beta";
  var orig = U.parseAddress;
  function cap(raw, kw, val) {
    var re = new RegExp("(?:" + kw + ")\\s*[:#=-]?\\s*(" + val + ")", "i");
    var m = re.exec(raw);
    return m && m[1] ? m[1] : null;
  }
  U.parseAddress = function (text) {
    var r = orig(text);
    var raw = String(text && text.text != null ? text.text : text == null ? "" : text);
    function add(field, rawv, ev, conf) {
      if (!rawv || (r.components && r.components[field])) return;
      r.components = r.components || {};
      r.components[field] = {
        field: field,
        raw_value: rawv,
        normalized_value: String(rawv).replace(/\s+/g, " ").trim(),
        confidence: conf,
        source_span: null,
        evidence: [ev],
        status: "parsed"
      };
    }
    add("unit", cap(raw, "شقة|شقه|وحدة|unit|apt\\.?", "[0-9٠-٩A-Za-z-]{1,8}"), "unit_kw", 0.86);
    add("floor", cap(raw, "دور|طابق|floor", "[0-9٠-٩]{1,3}"), "floor_kw", 0.84);
    if (raw.indexOf("الخرج") >= 0) add("city", "الخرج", "alias_patch", 0.82);
    if (raw.indexOf("الملقا") >= 0) add("district", "الملقا", "alias_patch", 0.82);
    if (raw.indexOf("اليرموك") >= 0) add("district", "اليرموك", "alias_patch", 0.82);
    if (raw.indexOf("لوسيل") >= 0) add("city", "لوسيل", "alias_patch", 0.82);
    if (r.formatted && r.formatted.ar) {
      if (r.components.unit) r.formatted.ar += "، شقة " + r.components.unit.normalized_value;
      if (r.components.floor) r.formatted.ar += "، دور " + r.components.floor.normalized_value;
      r.formatted.shipping_ar = r.formatted.ar;
    }
    return r;
  };
  U.parse = U.parseAddress;
})();
