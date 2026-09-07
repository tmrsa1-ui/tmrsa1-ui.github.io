/* عنواني PWA — local engine only */
(function () {
  const U = globalThis.Unwani;
  if (!U || !U.parseAddress) {
    console.error("Unwani engine missing");
    return;
  }

  const PAGES = [
    ["home", "الرئيسية"],
    ["parse", "حلل عنوانًا"],
    ["compare", "قارن عنوانين"],
    ["ship", "عنوان شحن"],
    ["short", "عنوان مختصر"],
    ["guide", "دليل الأنظمة"],
    ["privacy", "الخصوصية"],
    ["method", "المنهجية"],
    ["sources", "المصادر"],
    ["api", "API"],
    ["app", "التطبيق"],
    ["changelog", "سجل القواعد"],
  ];

  const SAMPLES = [
    "الرياض حي العارض شارع ريحانة بنت زيد مبنى 2929 الرمز 13337 الرقم الإضافي 8118",
    "حي النرجس بعد مسجد الراجحي ثاني لفة يمين البيت الأبيض رقم 12",
    "Riyadh Al Arid 2929 Rayhana Bint Zaid St zip 13337 add no 8118",
    "دبي البرشاء 1 خلف مول الإمارات مكاني 1234567890",
    "الدوحة مبنى 25 شارع 230 منطقة 56",
    "RAGI2929",
    "Building 25, Street 230, Zone 56, الدوحة",
  ];

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, function (ch) {
      if (ch === "&") return "&" + "amp;";
      if (ch === "<") return "&" + "lt;";
      if (ch === ">") return "&" + "gt;";
      if (ch === '"') return "&" + "quot;";
      return "&#39;";
    });
  }

  function show(id) {
    document.querySelectorAll(".page").forEach((el) => {
      el.classList.toggle("active", el.dataset.page === id);
    });
    document.querySelectorAll("#nav button").forEach((b) => {
      b.classList.toggle("active", b.dataset.page === id);
    });
    location.hash = id;
  }

  const nav = document.getElementById("nav");
  if (nav && !nav.childElementCount) {
    for (const [id, label] of PAGES) {
      const b = document.createElement("button");
      b.textContent = label;
      b.dataset.page = id;
      b.addEventListener("click", () => show(id));
      nav.appendChild(b);
    }
  }
  const initial = location.hash.replace("#", "") || "parse";
  show(PAGES.some(([id]) => id === initial) ? initial : "parse");

  const samples = document.getElementById("samples");
  if (samples && !samples.childElementCount) {
    for (const s of SAMPLES) {
      const b = document.createElement("button");
      b.className = "subtle";
      b.textContent = s.slice(0, 36) + (s.length > 36 ? "…" : "");
      b.addEventListener("click", () => {
        document.getElementById("input").value = s;
        renderParse();
      });
      samples.appendChild(b);
    }
  }

  function statusLabel(status) {
    const map = {
      PARSED: "محلَّل",
      PARTIALLY_PARSED: "محلَّل جزئيًا",
      SYNTAX_VALID: "الشكل مطابق",
      NEEDS_REVIEW: "يحتاج مراجعة",
      INVALID: "غير صالح",
      UNSUPPORTED_COUNTRY: "دولة غير مدعومة",
      UNSUPPORTED_ADDRESS_SYSTEM: "نظام غير مدعوم بعد"
    };
    return map[status] || status;
  }
  function statusClass(status) {
    if (status === "PARSED" || status === "SYNTAX_VALID") return "ok";
    if (status === "INVALID" || status === "UNSUPPORTED_COUNTRY" || status === "UNSUPPORTED_ADDRESS_SYSTEM") return "bad";
    return "warn";
  }

  function renderParsed(r) {
    const rows = Object.values(r.components || {})
      .map((c) => `<tr>
        <td>${escapeHtml(c.field)}</td>
        <td>${escapeHtml(c.raw_value)}</td>
        <td>${escapeHtml(c.normalized_value)}</td>
        <td>${Math.round(c.confidence * 100)}%</td>
        <td class="muted">${escapeHtml((c.evidence || []).join("، "))}</td>
      </tr>`)
      .join("");
    const reasons = (r.confidence?.reasons || [])
      .map((x) => `<li>${escapeHtml(x.message_ar)}</li>`)
      .join("");
    return `
      <div class="card">
        <p>
          <span class="status-pill ${statusClass(r.status)}">${escapeHtml(r.status)}</span>
          <span class="conf-pill">ثقة إجمالية ${Math.round((r.confidence?.score || 0) * 100)}%</span>
          <span class="muted">${escapeHtml(r.country)} / ${escapeHtml(r.address_system)} / ${escapeHtml(r.ruleset || "")}</span>
        </p>
        <p class="muted">التحقق الرسمي: ${escapeHtml(r.official_verification?.status || "OFFICIAL_LOOKUP_NOT_PERFORMED")} — لم يُجرَ اتصال بمصدر حكومي.</p>
        <h3>النص الأصلي</h3>
        <div class="raw-box">${escapeHtml(r.raw_text)}</div>
        <h3>المكونات</h3>
        <table>
          <thead><tr><th>الحقل</th><th>الأصل</th><th>المطبّع</th><th>الثقة</th><th>الدليل</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="5" class="muted">لا مكونات مستخرجة</td></tr>'}</tbody>
        </table>
        <h3>عنوان منسّق</h3>
        <p>${escapeHtml(r.formatted?.ar || "—")}</p>
        <p class="muted">${escapeHtml(r.formatted?.en || "الإنجليزية ليست حقيقة رسمية إن لم ترد في النص")}</p>
        <h3>لماذا هذه الثقة؟</h3>
        <ul>${reasons}</ul>
        <p><strong>معالم:</strong> ${(r.landmarks || []).length ? escapeHtml(r.landmarks.join("، ")) : "—"}</p>
        <p><strong>تعليمات وصول:</strong> ${(r.delivery_instructions || []).length ? escapeHtml(r.delivery_instructions.join("، ")) : "—"}</p>
        <p><strong>غير مفهوم:</strong> ${(r.unparsed_fragments || []).length ? escapeHtml(r.unparsed_fragments.join(" | ")) : "—"}</p>
        <p class="muted">حالات إضافية: ${escapeHtml((r.statuses || []).join("، "))}</p>
      </div>`;
  }

  let last = null;
  function renderParse() {
    const text = document.getElementById("input").value;
    last = U.parseAddress(text);
    document.getElementById("result").innerHTML = renderParsed(last);
  }

  document.getElementById("parseBtn")?.addEventListener("click", renderParse);
  document.getElementById("clearBtn")?.addEventListener("click", () => {
    document.getElementById("input").value = "";
    document.getElementById("result").innerHTML = "";
    last = null;
  });
  document.getElementById("copyJsonBtn")?.addEventListener("click", async () => {
    if (!last) renderParse();
    if (last) await navigator.clipboard.writeText(JSON.stringify(last, null, 2));
  });
  document.getElementById("copyShipBtn")?.addEventListener("click", async () => {
    if (!last) renderParse();
    if (last) await navigator.clipboard.writeText(last.formatted?.shipping_ar || last.formatted?.ar || "");
  });
  document.getElementById("saveLocalBtn")?.addEventListener("click", () => {
    if (!last) renderParse();
    if (!last) return;
    const key = "unwani.saved";
    const cur = JSON.parse(localStorage.getItem(key) || "[]");
    cur.unshift({ raw: last.raw_text, formatted: last.formatted?.ar, at: Date.now() });
    localStorage.setItem(key, JSON.stringify(cur.slice(0, 50)));
    alert("حُفظ على هذا الجهاز فقط.");
  });
  document.getElementById("deleteLocalBtn")?.addEventListener("click", () => {
    localStorage.removeItem("unwani.saved");
    alert("حُذفت البيانات المحلية.");
  });

  document.getElementById("cmpBtn")?.addEventListener("click", () => {
    const a = document.getElementById("cmpA").value;
    const b = document.getElementById("cmpB").value;
    const m = U.compare(a, b);
    document.getElementById("cmpOut").innerHTML = `
      <div class="card">
        <p>القرار: <strong>${escapeHtml(m.decision)}</strong> — الدرجة ${m.score}</p>
        <p>متطابق: ${escapeHtml((m.matching || []).join("، ") || "—")}</p>
        <p>متضارب: ${escapeHtml((m.conflicting || []).join("، ") || "—")}</p>
        <p>ناقص: ${escapeHtml((m.missing || []).join("، ") || "—")}</p>
        <p>يحتاج مراجعة: ${m.needs_review ? "نعم" : "لا"}</p>
        <p class="muted">${escapeHtml(m.explanation?.ar || "")}</p>
      </div>`;
  });

  document.getElementById("shipBtn")?.addEventListener("click", () => {
    const r = U.parseAddress(document.getElementById("shipIn").value);
    document.getElementById("shipOut").innerHTML = `<div class="card"><div class="raw-box">${escapeHtml(r.formatted?.shipping_ar || r.formatted?.ar || "لا يوجد ما يكفي للتنسيق")}</div><p class="muted">${escapeHtml(r.status)} — ليست نتيجة رسمية</p></div>`;
  });

  document.getElementById("shortBtn")?.addEventListener("click", () => {
    const r = U.parseAddress(document.getElementById("shortIn").value.trim());
    const ok = !!(r.components?.short_address && /^[A-Z]{4}\d{4}$/.test(r.components.short_address.normalized_value));
    document.getElementById("shortOut").innerHTML = `
      <div class="card">
        <p>الشكل ${ok ? "يطابق نمط 4 أحرف + 4 أرقام" : "لا يطابق نمط العنوان المختصر المنشور"}.</p>
        <p class="muted">مطابقة الشكل ليست تحققًا رسميًا.</p>
        ${renderParsed(r)}
      </div>`;
  });

  function tryInstall() {
    alert("على آيفون: زر المشاركة ثم «إضافة إلى الشاشة الرئيسية».");
  }
  document.getElementById("installBtn")?.addEventListener("click", tryInstall);
  document.getElementById("installBtn2")?.addEventListener("click", tryInstall);
  const installBtn = document.getElementById("installBtn");
  if (installBtn) installBtn.hidden = false;

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => undefined);
  }
  const flag = document.getElementById("offlineFlag");
  if (flag) flag.textContent = navigator.onLine ? "" : "تعمل دون اتصال";
  window.addEventListener("offline", () => { if (flag) flag.textContent = "تعمل دون اتصال"; });
  window.addEventListener("online", () => { if (flag) flag.textContent = ""; });
})();
