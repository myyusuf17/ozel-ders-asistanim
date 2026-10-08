(function () {
  "use strict";

  var API_URL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
    ? "http://localhost:8787/report"
    : "https://api.ozeldersasistanim.com/report";

  var TR = {
    "demo.statusThinking": "Claude notları okuyor ve raporu hazırlıyor…",
    "demo.statusWriting": "Yazılıyor…",
    "demo.statusDone": "Taslak hazır. Göndermeden önce gözden geçirip düzenleyin.",
    "demo.errRate": "Kısa sürede çok fazla istek gönderildi. Lütfen bir dakika bekleyip tekrar deneyin.",
    "demo.errRefusal": "Model bu isteği yanıtlamadı. Lütfen olağan ders notları girin.",
    "demo.errConfig": "Demo şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.",
    "demo.errBusy": "Yapay zekâ servisi şu an yoğun. Lütfen biraz sonra tekrar deneyin.",
    "demo.errGeneric": "Rapor oluşturulurken bir sorun oluştu. Lütfen tekrar deneyin.",
    "demo.errNetwork": "Demo servisine ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.",
    "demo.copy": "Kopyala",
    "demo.copied": "Kopyalandı"
  };

  var SAMPLES = {
    tr: {
      student: "Öğrenci A",
      context: "8. sınıf · Matematik",
      notes: [
        "Pzt: Birinci dereceden denklemlere giriş. Temel denklemleri rahat çözüyor, kesirli denklemlerde payda eşitlerken işlem hatası yapıyor.",
        "Çar: Sözel problemleri denkleme çevirme. 10 sorudan 6 doğru; problemi okuyup bilinmeyeni belirlemekte zorlanıyor.",
        "Cum: 20 soruluk mini deneme: 14 doğru, 4 yanlış, 2 boş. Boş bıraktıkları geometri sorusuydu.",
        "Ödevler: 3 ödevden 2'si zamanında ve eksiksiz teslim edildi, 1'i yarım kaldı.",
        "Genel: Derse katılımı iyi, soru sormaktan çekinmiyor. Süre baskısı olunca acele edip dikkatsizlik yapıyor."
      ].join("\n")
    },
    en: {
      student: "Student A",
      context: "Grade 8 · Maths",
      notes: [
        "Mon: Introduction to linear equations. Solves basic equations confidently; makes arithmetic slips when clearing fractions.",
        "Wed: Turning word problems into equations. 6 out of 10 correct; struggles to identify the unknown after reading the problem.",
        "Fri: 20-question mini test: 14 correct, 4 wrong, 2 blank. The blanks were geometry questions.",
        "Homework: 2 of 3 assignments handed in on time and complete, 1 left half-finished.",
        "Overall: Participates well and isn't shy about asking questions. Rushes and makes careless mistakes under time pressure."
      ].join("\n")
    }
  };

  var form = document.getElementById("report-form");
  var notes = document.getElementById("notes");
  var student = document.getElementById("student");
  var context = document.getElementById("context");
  var count = document.getElementById("notes-count");
  var notesError = document.getElementById("notes-error");
  var submitBtn = document.getElementById("submit-btn");
  var sampleBtn = document.getElementById("sample-btn");
  var copyBtn = document.getElementById("copy-btn");
  var statusEl = document.getElementById("status");
  var report = document.getElementById("report");

  var rawText = "";
  var busy = false;

  function lang() { return document.documentElement.lang === "en" ? "en" : "tr"; }
  function t(key) {
    return lang() === "en" ? (window.I18N_EN && window.I18N_EN[key]) || TR[key] : TR[key];
  }

  function updateCount() { count.textContent = notes.value.length + " / 3000"; }

  function isSampleOrEmpty(field, key) {
    var v = field.value.trim();
    return !v || v === SAMPLES.tr[key] || v === SAMPLES.en[key];
  }

  function fillSample(force) {
    var s = SAMPLES[lang()];
    ["student", "context", "notes"].forEach(function (key) {
      var field = { student: student, context: context, notes: notes }[key];
      if (force || isSampleOrEmpty(field, key)) field.value = s[key];
    });
    updateCount();
  }

  // --- Minimal, safe Markdown → HTML (headings, bullets, bold) ---------------
  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function inline(s) {
    return escapeHtml(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  }
  function renderMarkdown(md) {
    var out = [];
    var inList = false;
    md.split("\n").forEach(function (line) {
      var l = line.trim();
      var bullet = /^[-*•]\s+(.*)$/.exec(l);
      if (bullet) {
        if (!inList) { out.push("<ul>"); inList = true; }
        out.push("<li>" + inline(bullet[1]) + "</li>");
        return;
      }
      if (inList) { out.push("</ul>"); inList = false; }
      if (!l) return;
      var heading = /^#{1,6}\s+(.*)$/.exec(l);
      if (heading) out.push("<h3>" + inline(heading[1]) + "</h3>");
      else out.push("<p>" + inline(l) + "</p>");
    });
    if (inList) out.push("</ul>");
    return out.join("");
  }

  function setStatus(text, kind) {
    statusEl.textContent = text || "";
    statusEl.className = "status" + (kind ? " status--" + kind : "");
  }

  function setBusy(on) {
    busy = on;
    submitBtn.disabled = on;
    sampleBtn.disabled = on;
    report.setAttribute("aria-busy", String(on));
    submitBtn.classList.toggle("is-loading", on);
  }

  var ERRORS = {
    rate_limited: "demo.errRate",
    refusal: "demo.errRefusal",
    not_configured: "demo.errConfig",
    upstream_busy: "demo.errBusy",
    notes_too_short: "demo.notesError"
  };

  function showError(code) {
    setStatus(t(ERRORS[code] || "demo.errGeneric") || t("demo.errGeneric"), "error");
  }

  async function generate() {
    rawText = "";
    report.innerHTML = "";
    copyBtn.hidden = true;
    setStatus(t("demo.statusThinking"), "info");
    setBusy(true);

    var payload = {
      lang: lang(),
      period: (form.querySelector('input[name="period"]:checked') || {}).value || "weekly",
      student: student.value,
      context: context.value,
      notes: notes.value
    };

    try {
      var res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok || !res.body) {
        var err = {};
        try { err = await res.json(); } catch (e) {}
        showError(err.error || (res.status === 429 ? "rate_limited" : "upstream_error"));
        return;
      }

      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      var buffer = "";
      var finished = false;

      while (!finished) {
        var chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });
        var events = buffer.split("\n\n");
        buffer = events.pop();
        events.forEach(function (evt) {
          var line = evt.split("\n").filter(function (l) { return l.indexOf("data: ") === 0; })[0];
          if (!line) return;
          var msg;
          try { msg = JSON.parse(line.slice(6)); } catch (e) { return; }
          if (msg.type === "text") {
            if (!rawText) setStatus(t("demo.statusWriting"), "info");
            rawText += msg.text;
            report.innerHTML = renderMarkdown(rawText);
          } else if (msg.type === "done") {
            finished = true;
            setStatus(t("demo.statusDone"), "success");
            copyBtn.hidden = !rawText;
          } else if (msg.type === "error") {
            finished = true;
            showError(msg.error);
          }
        });
      }
      if (!finished) showError("upstream_error");
    } catch (e) {
      setStatus(t("demo.errNetwork"), "error");
    } finally {
      setBusy(false);
    }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (busy) return;
    var ok = notes.value.trim().length >= 20;
    notesError.hidden = ok;
    notes.setAttribute("aria-invalid", String(!ok));
    if (!ok) { notes.focus(); return; }
    generate();
  });

  notes.addEventListener("input", function () {
    updateCount();
    if (notes.value.trim().length >= 20) { notesError.hidden = true; notes.removeAttribute("aria-invalid"); }
  });

  sampleBtn.addEventListener("click", function () { fillSample(true); notes.focus(); });

  copyBtn.addEventListener("click", function () {
    var label = copyBtn.querySelector("span");
    navigator.clipboard.writeText(rawText).then(function () {
      label.textContent = t("demo.copied");
      setTimeout(function () { label.textContent = t("demo.copy"); }, 1600);
    }).catch(function () {});
  });

  // Swap sample text when the language changes (only if the user hasn't edited it).
  new MutationObserver(function () { fillSample(false); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

  fillSample(false);
})();
