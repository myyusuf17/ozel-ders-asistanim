(function () {
  "use strict";

  var API_URL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
    ? "http://localhost:8787/waitlist"
    : "https://api.ozeldersasistanim.com/waitlist";

  var TR = {
    "wl.errName": "Lütfen adınızı ve soyadınızı yazın.",
    "wl.errEmail": "Lütfen geçerli bir e-posta adresi girin.",
    "wl.errConsent": "Devam etmek için gizlilik onayını işaretleyin.",
    "wl.errRate": "Kısa sürede çok fazla deneme yapıldı. Lütfen bir dakika sonra tekrar deneyin.",
    "wl.errGeneric": "Kaydınız alınamadı. Lütfen tekrar deneyin ya da bize e-posta gönderin.",
    "wl.sending": "Gönderiliyor…",
    "wl.alreadyText": "Bu e-posta zaten listemizde; bilgilerinizi güncelledik."
  };

  var form = document.getElementById("waitlist-form");
  if (!form) return;
  var fields = document.getElementById("wl-fields");
  var success = document.getElementById("wl-success");
  var errorEl = document.getElementById("wl-error");
  var submit = document.getElementById("wl-submit");
  var name = document.getElementById("wl-name");
  var email = document.getElementById("wl-email");
  var consent = document.getElementById("wl-consent");

  function lang() { return document.documentElement.lang === "en" ? "en" : "tr"; }
  function t(key) {
    return lang() === "en" ? (window.I18N_EN && window.I18N_EN[key]) || TR[key] : TR[key];
  }

  function showError(key, field) {
    errorEl.textContent = t(key);
    errorEl.hidden = false;
    [name, email].forEach(function (f) { f.removeAttribute("aria-invalid"); });
    if (field) {
      if (field !== consent) field.setAttribute("aria-invalid", "true");
      field.focus();
    }
  }

  var ERRORS = {
    name_required: ["wl.errName", name],
    invalid_email: ["wl.errEmail", email],
    consent_required: ["wl.errConsent", consent],
    rate_limited: ["wl.errRate", null]
  };

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    errorEl.hidden = true;

    if (!name.value.trim()) return showError("wl.errName", name);
    if (!email.validity.valid || !email.value.trim()) return showError("wl.errEmail", email);
    if (!consent.checked) return showError("wl.errConsent", consent);

    var label = submit.querySelector("span");
    var original = label.textContent;
    submit.disabled = true;
    label.textContent = t("wl.sending");

    var data = new FormData(form);
    var payload = {
      name: data.get("name"),
      email: data.get("email"),
      role: data.get("role"),
      students: data.get("students"),
      city: data.get("city"),
      website: data.get("website"),
      consent: consent.checked,
      lang: lang()
    };

    try {
      var res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      var body = {};
      try { body = await res.json(); } catch (err) {}

      if (res.ok && body.ok) {
        fields.hidden = true;
        success.hidden = false;
        if (body.already) success.querySelector("p").textContent = t("wl.alreadyText");
        success.focus();
        return;
      }
      var mapped = ERRORS[body.error] || ["wl.errGeneric", null];
      showError(mapped[0], mapped[1]);
    } catch (err) {
      showError("wl.errGeneric", null);
    } finally {
      submit.disabled = false;
      label.textContent = original;
    }
  });

  [name, email].forEach(function (f) {
    f.addEventListener("input", function () { f.removeAttribute("aria-invalid"); });
  });
})();
